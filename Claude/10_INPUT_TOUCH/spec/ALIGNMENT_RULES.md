# THE ALIGNMENT RULES — the owner's, and the only input model

⚠ **It was `FORK_C_ANCHOR_RULES.md` until 2026-09-17**, when forks A and B were deleted
(`D40`) and this set became the model rather than one of three. ⛔ Renamed because a filename
that says *fork C* when no forks exist is the same lie as a type called `OWNER_TBD` that runs
rules — and this one was reached by 21 links. ⭐ The text below keeps every mention of *fork
C* that is HISTORY; what changed is the name of the thing a session opens.

> **STATUS** · ✅ **STAGE 1 CLOSED BY A DEVICE LOOK (2026-09-17)** · 🔨 stage 2 superseded by `APPROACH_AND_MATE.md` · **OWNS** ·
> the alignment rules — the tap, the twist, the undos, and what a turned Pioneer costs
> **READ IF** · you are building or judging the ALIGNMENT (the tap-to-align model)
> **LAST VERIFIED** · 2026-09-17

✅✅ **STAGE 1 IS CLOSED BY A DEVICE LOOK** — *"device pass ok, except these modifications"*
(owner, 2026-09-17), and all five modifications are built: everything simultaneous (`D43`),
the tap aligning in either movement mode (`D44`), the sway restored on an aligned rotation
(defect 47), the snap played as a slerp (`D45`), and the twist no longer killing it (defect
48). ⭐ Both undos are kept — the shake AND the re-tap.
⚠⚠ **WHAT THE CLOSE DOES NOT COVER, STATED**: the five corrections have **not themselves been
re-judged** by a hand, except the slerp's speed, which the owner tuned three times in a few
minutes. ⛔ The close is only as strong as the phrase that gave it — this project already
learned that from `A15`'s *"everything is working ok"*. ⚠ `TargetPosition`, the gizmo, the orbit and the approach (§2's last four bullets)
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

✅✅ **AND THE SECOND HALF OF §2 IS SUPERSEDED — the owner's word, 2026-09-17: *"indeed, this
is superseded."*** On 2026-09-17 the owner specified a
different **Approach & Mate** mechanism — centre-to-centre, with a capture radius, a docking
angle and a snap — which needs **no `TargetPosition` and no cross-quad gizmo** and says so:
*"nothing to be specifically built as everything is available with current build."*
⛔ [`APPROACH_AND_MATE.md`](APPROACH_AND_MATE.md) is the live design. §2's last four bullets
below are **kept, not deleted**: they are the owner's text, and `METHOD` — *when two sections
conflict, the later one wins, and the superseded one explains why the current one exists*.
⚠ One thing genuinely died with them: the **orbit about a target point** has no equivalent in
the new mechanism. ⭐ Nothing asked for it back, and the approach it belonged to is gone.

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

And, immediately after, an amendment — verbatim:

> *"amendment to my previous post:*
> * *when an object is aligned, the FollowerFace shall be highlighted and the PioneerFace
>   contour shall be highlighted, until the alignment is broken*
> * *in addition to the shake, the alignment can be toggled off by taping another time to the
>   same PioneerFace. We will later see if we keep the shake, as this is a complicated
>   movement to execute by the user; for the moment, we keep it."*

✅ **BOTH ARE BUILT** (619 vectors). ⭐⭐ Together they **retire the clause *"then the
PioneerFace resets as null"*** from §2: the Pioneer's identity now survives the gesture,
because the contour has to be drawn on it and the re-tap has to recognise it. ⛔ What has NOT
changed is the constraint, which still stores a **frozen world direction** — so moving the
Pioneer's object afterwards still does not drag the alignment with it.
⚠ **The re-tap undo is a `ROTATE` gesture** (a tap in `TRANSLATE` keeps `D28`'s toggle), so
the shake remains the only undo while translating — which is exactly why the owner keeps it
*for the moment*: *"we will later see if we keep the shake, as this is a complicated movement
to execute by the user."*
⚠⚠ **ONE PAIR IS VISUALISED.** Two objects can each hold an alignment, and the highlights
show only the latest — stated rather than hidden, and a question for the device pass.

✅ **ALL FIVE CORRECTIONS ARE DONE** (2026-09-16, 615 vectors). ⭐ Two were **defects of mine** and are in
the ledger — the highlight was built and wiped one event later, and the shake's axis was
claimed once at the press. ⛔ The third correction **retires a rule the owner had dictated
himself** (the automatic switch to translation), which is why §2's text keeps it and this
block overrides it: *the later text wins, and the superseded one explains why the current one
exists.*

### ✅ THE SNAP IS ANIMATED — `D45`, 2026-09-17

> *"When the first object rotates to align (both in translation mode or rotation mode), make
> the rotation a slerp instead of instantaneous. Use the available sliders so we do not inflate
> the numbers of tuning parameters sliders."*

⭐ Played over **2/7 of `cameraResetMs`** with the camera reset's own **`easeInOut`** — the
same kind of number (how long a discrete, hand-requested snap takes) and the only one in the
config. ⚠ *"Too slow: make it twice faster"*, then *"1/3rd"*, then *"2/7th"* (owner, same day):
three judgements in a row, expressed as a **ratio** rather than a second tunable — one slider
still governs both animations, and at 450 ms the snap takes **≈129 ms**. ⭐ A hand converging
on a feel is what sliders exist for; if it keeps moving, a config FIELD with a URL override
costs no menu space and no deploy. ⚠ At `0` it is instantaneous, exactly as the camera's is.

⛔⛔ **AND IT LOOKED UNWIRED IN `ROTATE` FOR AN HOUR** — *"there is no slerp during rotation:
did you wire it?"* ⭐ It was wired in both modes; the TWIST killed it. The twist path used to
*land* an in-flight snap before turning, so the first finger movement past the deadband ended
the animation — and in `TRANSLATE` the holder writes only POSITION, so there the snap survived
and was visible. ✅ The twist now **rides along**: it is a world rotation about the aligned
axis, so composing it onto both ends of the animation keeps the snap travelling AND accumulates
the turn. ⚠ Both gestures get what they asked for, rather than one winning.
⛔⛔ **IT IS NOT THE ROTATION INERTIA A HAND REJECTED** (`THIRD_PARTY_NOTICES.md`): that was a
follower on CONTINUOUS rotation, where the finger must be answered instantly. ⭐ The
distinction that makes one wrong and the other right: *a gesture in flight answers the hand; a
snap the hand has already asked for may take a moment to arrive.*
⚠ The **constraint is pushed immediately** while the pose travels — so for a few frames the
object does not yet satisfy its own alignment. ⛔ Deliberate: the stack is what the twist, the
readout and the re-tap all read, and a stack that lagged the gesture would make all three
briefly wrong. ⛔ A release mid-flight **stops** the snap where it is rather than finishing it,
because *releasing must not rotate the object* — the owner's own rule.

### ⭐⭐⭐ THE PIONEER'S OBJECT IS TURNED — dictated as a flag, **merged into the GESTURE**

> *"Now create a flag with two forks for the case in which the second object with PioneerFace
> is rotated while the first object is aligned:*
> * *fork C1: in this fork, this case releases the first object alignment (but not rotate the
>   first object) and un-highlight PioneerFace and FollowerFace.*
> * *fork C2: in this fork, the rotation of the second object triggers the same rotation of the
>   first object: therefore the first object keeps its alignment (and the alignment is updated
>   per frame to match the second object's PioneerFace normal) and no action for faces
>   highlights. Also, the release of first object's alignment and un-highlights also applies if
>   the shake is performed on the second object (the one with PioneerFace)"*

⛔⛔ **AND THE FLAG WAS DELETED THE SAME DAY — `D42`, four hours later:**

> *"Remove the two forks and slider. We will merge the logic as follows: one single tap on the
> second object PioneerFace: the logic is as fork C1 … one double tap on the second object
> PioneerFace: the logic is as fork C2 but the FollowerFace is highlighted in the same color as
> the PioneerFace. Note that a single tap on PioneerFace can follow a double tap on PioneerFace
> or a double tap can follow a single tap and therefore toggle to behaviors accordingly."*
> — and, immediately after: *"the double tap in such case shall not trigger the camera orbit
> reset."*

✅ **BOTH READINGS SURVIVE; THE FLAG DOES NOT.** A **single tap** makes a `SNAPSHOT`
(`D41`'s C1), a **double tap** makes a `FOLLOW` (C2), and the mode belongs to the ALIGNMENT
rather than to the session. ⭐⭐ Which is better than a flag in the way that matters: two
alignments can differ, and the **colours say which is which** — cyan Follower + amber Pioneer
for a snapshot, **both amber** for a relationship.

⭐ **EACH GESTURE IS ITS OWN TOGGLE**, so nothing has to be remembered: the same gesture on the
same face lets the alignment go (`D39`), the other gesture switches the mode without moving
anything. ⚠ Leaving `FOLLOW` by single taps therefore takes two — one to switch, one to
release — which is the price of one gesture carrying two jobs, and a device question.

⚠⚠ **A DOUBLE TAP THAT ALIGNS NO LONGER FLIES THE CAMERA HOME** (the owner's second
message). ⛔ Everywhere else — empty space, the held object, a second touchpoint — the double
tap keeps every meaning it had. Only this configuration is claimed.

⛔⛔ **THE CASE HAD NO RULE AT ALL, AND ITS ABSENCE WAS INVISIBLE.** §1.4 stores an alignment
as a **frozen world direction**, deliberately, so a later camera orbit cannot redefine it.
⚠ The price, never stated until now: turning the object that direction was READ FROM leaves
the Follower obeying a target nothing on the glass corresponds to — and both highlights keep
saying the relationship holds. ⭐ C1 and C2 are opposite answers to *what an alignment IS*: a
snapshot of a direction, or a relationship between two faces.

⭐⭐ **WHAT MAKES C2 EXACT**: the Follower takes the **same WORLD rotation** (`now ∘ before⁻¹`),
and applying one world rotation to both objects preserves the angle between any two of their
directions — so the faces stay parallel *by construction*, with no solve and no chance of the
solver adding a twist. ⛔ The object-frame composition (`before⁻¹ ∘ now`) is the plausible
error, it agrees with the right one at the identity, and a vector measures both.

⚠⚠ **ONE GAP, DICTATED AND KEPT**: the shake-on-the-Pioneer clause is **C2's**. In C1 it is
usually free — shaking while rotating turns the object, and a turn releases — but **in
`TRANSLATE` a shake on the Pioneer turns nothing, so C1 releases nothing**. ⛔ Left as
written; whether C1 wants the clause too is a question for the device pass.

---

## 3. MY READING — the rules as a state machine

⚠ Mine, for the conflict check. Where it guesses, §7 asks instead of assuming.

| state | what is true | one finger on obj 1 does | second finger does |
|---|---|---|---|
| **C0** | nothing held | — | camera: orbit (§2 r1), pinch (§4 r4), double-tap home |
| **C1** | holding obj 1, no alignment | rotate (mode `ROTATE`) or translate (mode `TRANSLATE`), per fork A | **tap on obj 2's face ⇒ ALIGN** (→ C2). Pressed-and-held: ⚠ §7.5 |
| **C2** | obj 1 aligned in `SNAPSHOT` (cyan+amber) or `FOLLOW` (both amber), ⛔ movement mode **unchanged — stays `ROTATE`** | ✅ `ROTATE`: **twist about the aligned normal** (owner, §7.3). `TRANSLATE`: fork A's screen-plane drag | press on obj 2 ⇒ `TargetPosition` + gizmo (→ C3) |
| **C3** | aligned + `TargetPosition` live | `ROTATE`: orbit obj 1 about the target. `TRANSLATE`: move obj 1 along centre→target | its own delta moves **obj 2** along target→centre |
| — | shake obj 1 (any state) | alignment released, highlight cleared, `FollowerFace` null | ⭐ and in **C2**, a shake on **obj 2** does the same (`D41`) |
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

⚠ **Since `D43` the holder's stillness is not required at all.** A second touchpoint drives **roll by its x** *or*
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

### 4.5 ⛔ THE REINSTATED FLICK RESET FIGHTS THE ALIGNMENT IT SHARES A BUILD WITH

A flick restores the orientation captured **at the press**. In C2/C3 the press snapshot is
from *before* the alignment, so a flick would rotate obj 1 off its aligned direction **while
the constraint stays on the stack**: the object and its own constraint would then disagree,
which is the one state §1.4 is built to prevent → §7.2.

⚠ Also: `ShakeDetector.suppressesFlick` exists because *a shake is two flicks by
construction*. In fork C the shake clears the alignment and the flick resets the rotation —
two different undos on gestures that look alike. ⭐ The suppression should stay wired, and
`D33`'s narrowing (it arms once the shake **fires**) is what keeps an abandoned shake from
also resetting the rotation.

### 4.6 ⚠ THE DEFAULTS — ✅ **AND MY PROPOSAL HERE WAS OVERRULED, 2026-09-16**

✅ **`D38`: FORK C IS THE DEFAULT FORK, NOW.** *"The game shall start by default to fork C,
not fork A."* ⛔ The sequencing I proposed below — ship fork A as the default until a hand
closes fork C — was sound about risk and wrong about whose loop this is: the owner IS the
hand, and fork C is what they are judging.
⛔⛔ **AND A SENTENCE HERE HAS SINCE GONE STALE, CORRECTED 2026-09-17**: it said *"fork A stays
one flag away (`?anchorRules=0`), which is what keeps the earlier closes reproducible."*
⚠ `D40` then **deleted** forks A and B, the `anchorRules` flag, its validator rule, the slider
and 41 vectors. ⭐ So the earlier closes are **no longer reproducible by a flag** — they are
reproducible only from git history, and that is a real cost `D40` accepted knowingly (*a
dormant fork is a trap*). ⛔ Everything below this line is the reasoning that was overruled,
kept as a record; the `anchorRules` numbers in it describe a flag that no longer exists.

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

## 6. TRANSITIONS — in and out of the alignment rules

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

## 9. WHAT IS BUILT — as of `1ebcad7`, 2026-09-16, **619 vectors, no device look**

⛔ Rule 5 is unpaid for every line of this section: *a look on a REAL DEVICE closes a change
and nothing else does.* ⭐ The three decisions it rests on are `D37` (the tap trigger), `D38`
(fork C is the default; no mode switch) and `D39` (both faces marked; the re-tap undo).

### The gestures, and where each one lives

| what a hand does | what happens | code |
|---|---|---|
| boot | fork C is **the default fork**, and the session starts in **`ROTATE`** | `gestureConfig.anchorRules = 2`, `scene.ts` |
| hold an object, **TAP a face on another** | the held object makes the **minimal** turn so its held face's normal is **PARALLEL** to the tapped one's; one alignment at a time, replaced by the next | `alignment.faceAlignConstraint`, `constraint_stack.singleAlignment`, `scene.alignFollowerToPioneer` |
| — and afterwards | the FollowerFace is **filled**, the PioneerFace gets a **contour**, both until the alignment breaks. ⛔ The mode does **not** change: the tap is consumed | `scene.placeFaceMarker`, `followerQuads` + `pioneerContours` (one per body/face since `A17`) |
| drag an **aligned** object in `ROTATE` | it **twists about the aligned normal** — the one surviving DOF | `anchor_rotate.constrainedDragAngle`, reused from `A3` |
| **flick** an object | the **rotation resets** to the press orientation. The alignment is **conserved** if older than the press, **dropped** if made during this gesture | `alignment.flickResetPlan` |
| **shake** an object | the alignment and both highlights go — in **either** mode, and **at any moment** in a gesture | `shake.ts` (a windowed reading), `evict` |
| **TAP the same PioneerFace again** | the alignment and both highlights go — the same undo, on an easier gesture | `alignment.tapMeaning` → `UNALIGN` |
| any other tap | `D28`'s mode toggle, unchanged | `mode_toggle.ts` |
| ⭐ **in EITHER movement mode** | the tap rules above do not read the movement mode at all (`D44`) | `alignment.tapMeaning` |
| ⭐ **the snap is a SLERP** | over `cameraResetMs`, eased; a release mid-flight stops it where it is (`D45`) | `core/vec.qSlerp`, `scene.alignAnim` |
| ⭐ **both fingers at once** | the holder's x/y and the second finger's axis apply **simultaneously** and sum (`D43`) | `depth_translate.secondFingerDrive` |

### ⭐ What was built ENGINE-FREE, with its mutants

`src/input/alignment.ts` + `tests/alignment.test.ts` (19 vectors) — `faceAlignConstraint`,
`tapMeaning` (three meanings), `flickResetPlan`; `singleAlignment` in
`core/constraint_stack.ts`; the rewritten `shake.ts`.
⛔ **Every one of them was shown to fail against the old code before it was trusted**:
anti-parallel instead of parallel reddens five including the composition; append instead of
replace reddens the cap; a reset that never drops reddens the *during-the-gesture* case; and
the old once-claimed shake axis reddens the drag-then-shake vector.

### ⚠⚠ THREE PLACES FORK C DELIBERATELY CONTRADICTS A DECISION ALREADY TAKEN

⛔ Each is written at its site in the code as well as here — a divergence nobody can find is
indistinguishable from a bug.

1. **`D32`'s shake is `ROTATE`-only; fork C's is not.** The owner's sentence carries no mode
   condition, and said so again when it failed. ⚠ The cost: in fork C a vigorous reposition
   can evict an alignment. The four shake tunables are the only defence, and they have
   sliders. ⭐ The re-tap (`D39`) now offers an easier undo, which is what will decide whether
   the shake survives at all.
2. **`D36` deleted the rotation reset globally; fork C reinstates it** — as a fork rule. Fork A
   shipped without it and still does.
3. **The session starts in `ROTATE` inside fork C only.** ⚠ Fork A's `TRANSLATE` start was
   closed by a hand, so `?anchorRules=0` must still reproduce it exactly.

---

## 10. ⭐⭐⭐ WHAT TO TEST NEXT — in order, and what would falsify each

⭐ The plain URL is enough: **https://dsug1.github.io/3d_assembly_game/**
⛔⛔ **CHECK THE HUD's `build` LINE FIRST.** It must read `1ebcad7` or later; on 2026-09-16 a
confirmed fix was reported broken from a tablet running a cached bundle.
⭐ The HUD also prints the mode, the selected face, the last verdict and — since `A17` — the
**alignment link table**, so *"nothing happened"* is never the only evidence.

⚠⚠ **CORRECTED 2026-09-17: THIS LIST USED TO TELL A TESTER TO LOOK FOR HUD TEXT THAT NO LONGER
EXISTS** (`anchor=forkC`, `forkC: ALIGNED …`). ⛔ The fork selector was deleted with forks A
and B, so a tester following the old wording would have found the strings missing and concluded
the build was broken. ⭐ A stale test instruction is worse than a stale comment: it manufactures
a defect report. What the HUD prints NOW:

| readout | means |
|---|---|
| `[ROTATE]` / `[TRANSLATE]` | the movement mode — one latch for the session |
| `⭭ f>p/face:C` | one entry per alignment: follower, Pioneer, Pioneer FACE, and `C` cyan / `F` orange |
| `◆TR a↔b` / `◇tR` | `A16`'s white-contour verdict and its two reasons (**T**ranslating, **R**ange) |
| `align: …` | the last alignment verdict, including every refusal, by name |

### A. Does the alignment model run at all

1. **Boot.** The HUD reads `[ROTATE]`, and the link table is **absent** (nothing is aligned).
   ⛔ *Falsified by* `[TRANSLATE]` at boot, or by any `⭭` entry before a tap.
2. **The alignment.** Hold one part; **tap** a face on another. The held part turns so its held
   face points **the same way** as the tapped one, the HUD gains a `⭭` entry naming both
   bodies, and the mode **stays** `ROTATE`.
   ⛔ *Falsified by* the mode flipping to `TRANSLATE`, by no `⭭` entry appearing, or by a
   refusal message — read it: it names which precondition failed.
   ⚠ **Parallel is deliberate** (`§5.2`): the held cube presents its **opposite** side toward
   the face you tapped. If that is not what you want, that is the sign to change, and it is
   one line.
3. **Both highlights, and their lifetime.** The Follower face is **filled**, the Pioneer face
   is **outlined**; lift every finger — both stay.
   ⛔ *Falsified by* either vanishing on release, or by the contour outliving the alignment.
   ⚠ The outline is one pixel wide by WebGL's rule; if it is too faint to judge, say so and it
   becomes a `GreasedLine`.
   ✅ **AND THEY MUST NOT LAG** — defect 46 (2026-09-17) was exactly one frame of it, every
   frame, because the markers were placed from a cached world matrix. ⛔ They are **parented**
   now, so drag or spin the object hard: a marker that still trails its face would mean the
   parenting is not doing what this claims.

### B. What the alignment is FOR

4. **The surviving DOF.** With the cube aligned, drag it (one finger, `ROTATE`). It should
   twist **about the aligned normal only**, and the aligned face should keep pointing where
   you put it.
   ⛔ *Falsified by* free rotation (the alignment breaks) or by nothing moving. ⚠ If the HUD
   says *degenerate*, that is correct and not a bug: the aligned normal points at the camera,
   so orbit a little and try again — the projection has no direction there.
5. **The rotation reset, both cases.** (a) Align, then **flick** in the same gesture → the
   rotation resets **and the alignment drops**. (b) Align, lift, press again, rotate, then
   flick → the rotation resets **and the alignment survives**.
   ⛔ *Falsified by* the two cases behaving alike — that is the whole of your *when*-scoping.

### C. The two undos, which is the comparison you asked for

6. **Re-tap.** Tap the **same** PioneerFace again → the alignment and both highlights go.
   ⚠ A **different** face of the same object re-aligns instead, by design.
7. **Shake, and specifically LATE in a gesture.** Press an aligned object, drag it somewhere
   **first**, and only then shake → the alignment releases. Then repeat in `TRANSLATE`.
   ⛔ *Falsified by* it working only when the shake starts at the press — that was defect 45,
   and this is the check that it is gone.
8. ✅ **ANSWERED 2026-09-17: BOTH ARE KEPT.** The shake and the re-tap both undo an
   alignment, and the owner kept both rather than dropping either. ⚠ So the shake's four
   tunables still matter, and item 9 below is still the safety question.

### C-bis. ⭐⭐ THE NEW FLAG — C1 against C2 (`D41`), a JUDGEMENT rather than a check

⚠ Both are built and neither is right by argument: the flag exists because *what an alignment
means* is a question about assembling parts, and only a hand answers it.

8-bis. **SNAPSHOT — align with a SINGLE tap**, then turn **obj 2**. ⛔ The alignment should
   release, **obj 1 must not move**, and both highlights go. ⭐ *Falsified by* obj 1 rotating,
   or by a highlight surviving. ⚠ The colours while it holds: **cyan** Follower, **amber**
   Pioneer.
8-ter. **FOLLOW — align with a DOUBLE tap**, then turn **obj 2**. ⛔ Obj 1 should take the same
   rotation and keep its alignment; the Follower is **amber too**, which is how you can tell
   the mode at a glance. ⭐ *Falsified by* the faces drifting out of parallel as you keep
   turning (the per-frame retarget exists to prevent it), or by the **camera flying home** on
   the double tap — that meaning is suppressed for this gesture only.
8-quater. **The toggles.** On the same face: the SAME gesture again releases; the OTHER gesture
   switches mode and **moves nothing** — only the colours change. ⚠ So leaving `FOLLOW` with
   single taps takes two. ⭐ Then **shake obj 2** while in `FOLLOW`: the alignment releases.
   ⛔ In `SNAPSHOT` that shake releases only while the mode is `ROTATE` (it releases by turning
   the object); in `TRANSLATE` it does nothing, which is the gap §2 flags.

### C-ter. ✅ WHAT THE SECOND DEVICE PASS ADDED (2026-09-17) — check these first

9-bis. **Everything simultaneous (`D43`).** Hold an object and drag it while the **second
   finger** drives its axis — roll in `ROTATE`, depth in `TRANSLATE`. ⛔ Both should apply at
   the same time; neither finger should have to wait for the other to settle.
   ⭐ *Falsified by* either contribution stopping while the other moves — that was `A10`'s
   gate, and it is deleted.
   ⚠⚠ **AND THE NEW EXPOSURE, WHICH IS WHAT TO WATCH FOR**: with no gate, a resting second
   finger's jitter can reach the object. `A11`'s per-axis deadband is the only thing stopping
   it, so if an object creeps or rolls while your second finger merely RESTS on the glass,
   that is `motionDeadbandMm` and not the new rule — raise it on the slider and say so.
9-ter. **The tap in `TRANSLATE` (`D44`).** While translating, tap (and double-tap) a face on
   another object. ⛔ It should align exactly as it does in `ROTATE`, and the movement mode
   should NOT change. ⭐ *Falsified by* the tap toggling the mode instead of aligning — and a
   tap on **empty space** must still toggle, which is what keeps `ROTATE` reachable.
9-quater. **The sway is back (defect 47).** Rotate an **aligned** object: the other objects
   should swing sympathetically, as they do for a free rotation.
   ⭐ *Falsified by* a still scene — that was the defect, caused by an early `return`.

9-quinquies. **The snap is a slerp (`D45`).** Align, and watch the turn: it should travel over
   **2/7 of** `cameraResetMs` (≈129 ms by default) with an ease in and out, not jump — **in BOTH
   modes**, including while you keep twisting the object.
   ⭐ *Falsified by* an instantaneous jump (check the **reset time** slider is not at 0 — it is
   the camera's, shared on purpose), or by the object continuing to turn after you SHAKE it
   mid-snap, which would mean a release is still rotating the object.
   ⚠ It shares the camera's slider, so tuning one tunes both: if they want different times,
   say so and it becomes two fields.

### D. The safety question I cannot answer without a hand

9. **Can an ordinary reposition evict by accident?** Fine-position an aligned object in
   `TRANSLATE` with small corrective back-and-forths. The alignment should survive.
   ⭐⭐ **THE OWNER SET THREE OF THE FOUR NUMBERS ON 2026-09-17, BEFORE THE PASS**: window
   **300 ms** (was 600), leg **6 mm** (was 8), straightness **0.45** (was 0.4) — so the
   gesture is now *smaller and faster* rather than smaller and slower, and two reversals must
   fall inside 300 ms. ⚠ That makes an accidental eviction harder and a deliberate one
   brisker; whether it is now too brisk to perform is exactly what this item asks.
   ⛔ The knobs are in the **EVICTION SHAKE** menu group, and this is the one place where a
   guessed number can destroy deliberate work.

### E. Fork A must be untouched — `?anchorRules=0`

10. No highlight, no alignment on a tap, the session starts in **`TRANSLATE`**, and a flick
    does **not** reset the rotation.
    ⛔ *Falsified by* any fork C behaviour appearing — which would mean the gate leaks, and
    every earlier device close (`A10`–`A15`, rule 6) would be in doubt.

### ⚠ Known gaps — do not report these as defects

* **Only one pair of highlights is drawn.** Two objects can each hold an alignment; the
  markers show the latest.
* **The whole second half of §2 is unbuilt** — `TargetPosition`, the cross-quad gizmo, the
  orbit about it and the approach translation. §7 asks the four questions that gate them.
* **The third cube** — *"nothing works on the third brown cube"* was reported on 2026-09-16
  and never diagnosed; it is registered identically to the other two. ⛔ If it recurs, the HUD
  line while pressing it (`face=…` and the verdict) is what settles it in one look.
