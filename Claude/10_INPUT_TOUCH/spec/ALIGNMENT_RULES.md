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

### ⭐⭐⭐ THE TRIGGER MOVED TO THE **PRESS** — `D55`, 2026-09-19

> *"when first touch is pressed on first object, as soon as a second touch is pressed on second
> object (= a tap or a continued press), the Pioneer - Follower mechanism toggles on. To toggle
> off, the rule stays unchanged."* — the owner

⛔⛔ **THE TRIGGER MOVED; THE MECHANISM DID NOT.** `alignFollowerToPioneer` runs unchanged,
with every refusal it already had — a frozen Follower, a press that resolved no face, the
cycle undo, the *exactly one other holder* rule. ⭐ What changed is **when** it is called, and
therefore **what counts as asking for it**: a finger that came down on the second body and
stayed there used to align nothing at all, because the old trigger was a release verdict.

⭐⭐ **THE PRESS IS AN ON-SWITCH AND NOTHING ELSE** — the owner's second sentence is a
constraint on the first. Every way OUT stays on the release: the shake, and the same gesture
again on the same face (`D39`). ⛔ So `pressMeaning` returns `NOTHING` — never `UNALIGN`, never
`TOGGLE` — whenever the configuration is not a *fresh* relation, and hands the event to
`tapMeaning`, which is untouched.

⚠⚠ **ONE CASE IS REFUSED ON PURPOSE: THE TWO BODIES ARE ALREADY RELATED — EITHER WAY ROUND.**
Without it, **picking an aligned pair up by its two bodies** would re-point the relation onto
whichever face the second finger happened to land on — or, on the same face, destroy it. ⭐ The
mechanism is already on; *"toggles on"* has nothing left to do. ⚠ Re-pointing to a different
face of that same Pioneer stays reachable **by the tap**, exactly as before.

⛔⛔⛔ **AND *EITHER WAY ROUND* WAS LEARNED THE HARD WAY, ON THE GLASS, WITHIN MINUTES.** The
first build of `D55` consulted only `pioneerOfHeld`, and the tablet answered:

> `align: objectA→objectB would cycle — broke objectB's own alignment instead`

⚠ With `A→B` live, picking the pair up in the OTHER order — hold `B`, press `A` — read as a
**fresh** relation. `wouldCycle` then did exactly its job and **destroyed the alignment the hand
was holding**. ⭐ Before `D55` that cost a deliberate tap; a press made it an accident.
⭐⭐ `METHOD`: *a substituted quantity* — *"is the HELD body related to the pressed one?"* stood
in for *"are these two bodies related?"*, and those two agree in one direction only. ⛔ The
mutant that reproduces the shipped defect is now a vector.

### ⛔⛔ AND THE PRESS CANNOT KNOW THE TAP COUNT — so it aligns as `SNAPSHOT`

`D42` gave the **gesture** the choice of what an alignment IS: a single tap makes a `SNAPSHOT`,
a double tap a `FOLLOW`. ⛔ A press precedes both. That is the one real collision in this
change, and it resolves through a route that already existed:

| | press | release |
|---|---|---|
| **single tap** | `ALIGN` as `SNAPSHOT` | ⚠ **spent** — consumed by its own press |
| **double tap** | #1 `ALIGN` as `SNAPSHOT`; ✅ #2 `SWITCH` → `FOLLOW` (`A22`) | both spent — ⚠ the release no longer has to arrive for the colour to change |
| **continued press** | `ALIGN` as `SNAPSHOT` (or `FOLLOW` if it completes a pair) | — (the finger is still down, which is the point) |
| **tap, then rapid press-and-hold** | ✅ `SWITCH` → `FOLLOW` on the way down (`A22`) | — |
| **press on a NEW face of the current Pioneer** | ✅ `ALIGN` as `SNAPSHOT` — re-points (`A23`) | spent |

⛔⛔⛔ **CORRECTED 2026-09-19 BY A DEVICE REPORT — AND THE STATED REASON HAD EXPIRED.**

> *"if the Follower object is cyan highlighted, a new double tap on the same PioneerFace should
> toggle follower object to orange highlighted. This is not the case right now."* — the owner

⭐⭐ **NO SINGLE STEP WAS WRONG; THE COMPOSITION WAS.** The four events:

| | | |
|---|---|---|
| press #1 | the face is already the Pioneer's, not yet a pair | `NOTHING` — correct |
| release #1 | `D39`: the same gesture on the same face **lets go** | `UNALIGN` — correct, **and the alignment is now gone** |
| press #2 | nothing is aligned, so this makes a **fresh** one | ⛔ returned `SNAPSHOT` — **the defect** |
| release #2 | spent by `D55` | so the `DOUBLE_TAP` that used to upgrade it never ran |

⚠ Before `D55` the same gesture worked by a two-step route: tap #1 unaligned and tap #2 re-aligned
with `modeForTap("DOUBLE_TAP")`. ⛔ Moving the ALIGN to the press broke that path, and the release
being spent hid the loss.

⛔⛔ **`D55`'s REASON WAS *"a press cannot know the tap count"*, AND `A22` MADE IT FALSE FOUR
HOURS LATER.** `TapHistory.wouldPair` answers exactly that on the way down, and
`completesDoubleTap` had been in `PressContext` ever since — read on the SWITCH path and left
unread on the ALIGN path. ✅ The `ALIGN` now reads it.
⭐⭐ `METHOD`: *a premise recorded as a REASON has to be re-checked when the thing it called
impossible gets built.* The comment outlived its own truth, and a green suite defended it because
every vector had been written from the same premise.

✅ **AND IT REMOVES THE CYAN FLASH** this section used to warn about for a double tap that lands
on a fresh face — press #2 there is the SWITCH path, which was already immediate.

### ⭐⭐⭐ `A22` — AND THE UPGRADE TO ORANGE FIRES ON THE WAY DOWN TOO

> *"why a single tap followed by a rapid press (the equivalent of double tap where the final
> release is not done) doesn't trigger a switch to orange?"* — the owner, 2026-09-19

⛔⛔ **BECAUSE `D55` MOVED HALF THE GESTURE, AND THIS IS THE OTHER HALF.** The ALIGN went to
the press; the mode SWITCH stayed on the release — where `TapHistory.record` asks the
double-tap question, because it is called **with the release time**. ⚠ So a second touch that
is *pressed and held* never asked it, and the alignment stayed cyan for as long as the finger
was down. ⭐ Nothing was defending that; it was `D55`'s own rule — *a tap **or a continued
press*** — applied to one half of the gesture and not the other.

⭐⭐ **`TapHistory.wouldPair` IS A PEEK AND MUTATES NOTHING.** The release still runs `record`,
which is what consumes the pair and clears the memory — two writers of one fact is the shape
this project forbids. ⛔ And it shares `pairsWithLast` with `record` rather than restating the
window and the slop, so **the press and the release cannot disagree about what a double tap
is**. ⚠ A disagreement there would be unfixable from the glass: the alignment would turn orange
and then let go of itself.

⚠ The window is measured **release-to-press**, so holding the second touch down does not spoil
the pair — `record` still says `DOUBLE_TAP` when it finally lifts, and a vector holds it for
1200 ms to pin that.

⛔⛔ **IT IS NARROW ON PURPOSE, IN THREE WAYS**, and each one has a mutant:

1. **Only the second of a rapid pair.** A *plain* press on the Pioneer's face is `D51`'s
   ordinary two-handed grab — the commonest thing a hand does here. ⚠ If every grab switched
   the mode, the Pioneer could not be picked up without flipping cyan↔amber under the fingers.
2. **Only onto `FOLLOW`, never back.** `modeForTap("DOUBLE_TAP")` is `FOLLOW`, so a rapid pair
   onto an alignment that is already `FOLLOW` is *the same gesture again* — which is `D39`'s
   toggle-**off**, and toggling off stays on the release, unchanged, as the owner required.
3. **Only on the same face.** The very test `tapMeaning` makes at the release, which is why
   `pioneerOfHeld` carries the face. ⚠ A press on a *different* face is `A23`'s re-point, below.

⚠ The release that follows such a press is **spent**, exactly as an aligning press's is —
otherwise the `DOUBLE_TAP` would arrive, find the mode already `FOLLOW`, and read as `UNALIGN`.
⛔ `Held.pressActed` is the field, renamed from `pressAligned` because it now answers *did my
press already act on the alignment?* rather than *did it align?*.

⛔ `SNAPSHOT` is also the conservative one to be wrong about: it leaves the Follower's rotation
independent, where a wrong `FOLLOW` would spin a body the hand never aimed at.

### ⛔⛔⛔ THE RELEASE THAT FOLLOWS AN ALIGNING PRESS IS **SPENT**, or the gesture undoes itself

⚠⚠ This is the trap the change is built around. The press aligns; the release that follows is
a `TAP` **on the very face that alignment names**, and `tapMeaning` reads that — correctly, and
by a rule the owner explicitly kept — as `UNALIGN`. ⭐ Align, then break, ~80 ms apart, with
nothing on the glass to show for it: the trigger would look simply broken.

⭐⭐ **AND THE QUESTION ASKED IS *"DID MY PRESS MAKE IT?"*, NOT *"IS IT ALIGNED?"*.** The
second is the substituted quantity again — it is equally true for the second tap of a double
tap, and **that** release must NOT be spent, because it is what carries `SNAPSHOT` → `FOLLOW`.
⛔ `Held.pressAligned` records the first question, per touchpoint, and dies with the grip.
⚠ It is also what consumes `D28`'s movement-mode toggle — one gesture, one consequence.

### ⭐⭐⭐ `A23` — AND A NEW FACE OF THE CURRENT PIONEER RE-POINTS, ALSO ON THE PRESS

> *"currently, a tap on a new face on pioneer object triggers the switch to this new PioneerFace
> and new alignment of the Follower object: add a continued press to also trigger this switch"*
> — the owner, 2026-09-19

⭐⭐ **`D55` FINISHING ITS OWN SWEEP.** *Tap or continued press* now governs all three things a
press can do to an alignment — **make** it (`D55`), **upgrade** it to `FOLLOW` (`A22`),
**re-point** it onto a new face (`A23`) — while the two ways OUT, the shake and the re-tap, stay
on the release exactly as required. ⛔ The press is still never a way out.

⚠ The re-point lands on **`SNAPSHOT`**, not on the mode it had, and that is not a new decision:
it is what a single TAP on a new face has always produced (`modeForTap("TAP")`). ⛔ A vector
asserts the press path and the release path agree, because two routes to one state that disagree
is how a colour ends up reporting something that is not true.

⚠⚠ **AND IT REVERSES A GUARD, WITH A COST WORTH NAMING.** Until `A23` a press on **any** face
of the current Pioneer did nothing, so the Pioneer could be picked up anywhere without
disturbing the relation. ⛔ Now only its **aligned face** is a safe handhold: grabbing it
anywhere else re-points the alignment onto the face under the finger — and with `D51` making a
finger on the Pioneer the ordinary posture, a hand will meet this. ⭐ It is the rule as dictated,
and it is **recoverable in one gesture**, which the destroyed-alignment case that `D55`'s first
build produced was not. ⚠ If it fights the hand on the device, the narrowing to try first is
*re-point only when the press is not part of a `D51` two-handed grab* — not a return to
refusing, which would take the owner's rule away.

⛔⛔ **WHAT `A23` DOES *NOT* RELAX: THE REVERSE DIRECTION.** When the **pressed** body follows
the **held** one, aligning held→pressed would close a cycle — the defect the glass found within
minutes of `D55`. ⚠ That is a different question from re-pointing: a hand may re-aim its own
Pioneer, while this configuration has no valid alignment to make at all. ⭐ Two vectors and a
mutant keep the two apart.

### ⚠⚠ WHAT THIS CHANGES AT BOOT — `D51` BECOMES THE ORDINARY POSTURE

⛔ `pinnedPair` needs a **live relation**, and that relation used to cost a deliberate tap. Now
the grab **is** it. ⚠ With `pioneerTranslates = 0` at boot (the owner, 2026-09-18), the second
body stops being cargo and becomes a **control surface** the instant it is touched: it will not
translate, and its finger drives the Follower's **depth and roll** together.

⭐ That is the owner's intent read plainly — two-handed assembly in one motion rather than two.
⚠ It is stated rather than discovered because **two fingers on two bodies now do something
different at boot than they did yesterday**, and no test here can judge whether it feels right.

---

## 3. MY READING — the rules as a state machine

⚠ Mine, for the conflict check. Where it guesses, §7 asks instead of assuming.

| state | what is true | one finger on obj 1 does | second finger does |
|---|---|---|---|
| **C0** | nothing held | — | camera: orbit (§2 r1), pinch (§4 r4), double-tap home |
| **C1** | holding obj 1, no alignment | rotate (mode `ROTATE`) or translate (mode `TRANSLATE`), per fork A | ✅ **PRESS on obj 2's face ⇒ ALIGN**, as `SNAPSHOT` (→ C2) — `D55`, 2026-09-19. ⛔ A **continued press** aligns too, which is what §7.5 asked and `D55` answered |
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

### ⛔⛔⛔ 5.5 THE SECOND TOUCHPOINT'S ROLL HAS A DEAD ZONE — device-reported 2026-09-19

> *"when I successively align on diverse PioneerFaces, for some of them I loose the roll control
> of the Follower object by the second touch."* — the owner

⭐⭐⭐ **MEASURED, AND IT IS NOT THE DEGENERACY ANYONE HAD WRITTEN DOWN.** Two places claimed
to own this failure and neither is what a hand meets: `constrainedDragAngle` documents its `null`
at *"the axis points at the camera"* (a knife edge — 20° off it, authority is still full), and
`scene.ts` claimed `D52`'s price was *"the axis square to the view"* (simply wrong, now corrected).

⛔ **THE REAL CAUSE.** The near side travels along `axis × (−view)`, which is **perpendicular to
the alignment axis's screen projection** — so the direction the object wants the finger to go
**spins as the alignment axis does**. `A16` gives this channel `dx` only (*its x is roll, its y is
depth*), so the authority is `|dir.x|`, a cosine in the axis's screen orientation:

| alignment axis on screen | near side travels | 2nd touch | 1st touch |
|---|---|---|---|
| vertical | horizontally | **20.0°** / 10 mm | 20.0° |
| 45° | diagonally | 14.1° | 28.3° |
| **horizontal** | **vertically** | **0.00° — dead** | 20.0° |

⭐ The first touchpoint never loses it: it passes `dx` **and** `dy`, so it can always drag along
the near-side direction whatever its screen orientation. ⚠ The asymmetry IS the defect, and a
vector measuring only the second finger could not have shown it.

⛔⛔ **AND `constrainedRollAngle` IS NOT A FALLBACK — stated so the next session does not try
it.** The obvious repair is *hand over to `A3`'s other chart where this one fades*. It does not
work: an axis horizontal on screen is **square to the view**, precisely where that chart returns
`null`. The two degeneracies were believed complementary and in this configuration they coincide.
⚠ Only the missing `dy` could serve it — which is a decision about `A16`'s channel split, not an
arithmetic repair. **It is the owner's call and is not made here.**

✅✅ **RESOLVED THE SAME DAY — `D57`: THE SECOND TOUCHPOINT'S ROLL IS NOW FLAT.**

> *"the dx on the screen shall drive the roll of the Follower, the dy on the screen shall drive
> the depth translation of the Follower, **whatever the orientation of the Pioneer-Follower
> duo**. If there are cos or sin projections on axis based on orientation, remove those
> projections."* — the owner

⛔⛔ **THE PROJECTION CARRIED THE RATE *AND* THE DIRECTION, AND ONLY THE RATE COULD GO.** The
rate is deleted: `flatTwistAngle` is `pxToMm(dx) × gain`, the same 20° per 10 mm for every
alignment axis, with no degeneracy left — even an axis pointing straight at the camera, which
used to refuse, now rolls. ⚠ A handedness, though, must be relative to something, and the
constraint axis can point at the camera or away from it: a raw `+dx` rolls **opposite to the
first touchpoint** wherever `dir.x < 0`, measured at `−1` for an axis vertical on screen — the
common case. ⛔ That is `D52`, the owner's own device report, returning.

⭐⭐ **SO THE SIGN IS READ FROM THE GEOMETRY ONCE AND LATCHED AT THE PRESS** (`rollSignFor`,
held in `Held.anchorRollSign` beside the anchor's motion tracker, dropped with it). ⛔ Per frame
it would flip mid-drag as the axis swung through horizontal-on-screen, at full rate — trading a
dead control for an unpredictable one. ⚠ `IN2` latches every role at press and `A15` allows
exceptions only on DISCRETE events; this is that doctrine one rule over.

⚠ **THE FALLBACK IS DECLARED**: where the axis is horizontal on screen there is no near-side x
to read, and `Math.sign` on a float-noise value is the audit's *"square to the bit"* trap. Below
`1e-9` it returns `+1` — arbitrary, stable, and the honest residue of an orientation-free rule.
⭐ A vector asserts the two laws still agree in DIRECTION for every non-degenerate axis, which is
`D52` preserved as a measurement rather than a promise.

⚠ **DEPTH NEEDED NO CHANGE**: `dy` already goes straight through. Its one sign,
`towardGravity`, is keyed on the CAMERA, not on the pair's orientation — it exists because the
gesture was backwards on the bottom ring — so it is not one of the projections the rule names.

⚠⚠ **IT FAILED SILENTLY UNTIL NOW**, which is why it cost a device report rather than a glance:
`twist` is `0`, not `null`, so nothing refused and nothing was printed — the hand dragged and the
body sat still with a clean HUD. ✅ Moot under `D57`: there is no fade left to report, and the readout added for it was removed
with the projection rather than left to describe a law the product no longer runs.

⛔⛔⛔ **AND CHASING IT FOUND A HOLE IN THE SUITE.** Negating `sy` in `nearSideScreenDirection`
— the *screen y grows downward* conversion the function's own comment calls *"the same sign trap
`translate.ts` calls the commonest defect in a drag"* — **survived all 880 vectors.** ⭐ Nothing
read `dir.y`'s sign: every consumer that could have is the second touchpoint's chart, which
passes `dx, 0`. ⚠ And the first vector written for this section asserted a **magnitude**, so it
hid the flip too — mistake shape 5, on top of the very trap the code warned about.
✅ Closed by DERIVING the direction: a near-side point is rotated by a small positive angle and
its displacement projected independently, so *the near side follows the finger* is a measurement
rather than a promise. The flip is now 6 red, and both screen axes are pinned separately.

---

### ⭐⭐⭐ 5.6 `D58` — THE MOVEMENT MODE TOGGLES ON A PRESS TOO

> ⚠⚠ **REPEALED BY §5.13 (`D66`), 2026-09-21 — a press no longer toggles the mode.**
> The text stands as the record of the decision and of what it cost.

> *"while the first touch is pressed on an object (free object or follower object), the toggle
> back and forth between rotation mode and translation mode can be triggered by:*
> * *a tap outside any object (this is currently what is built)*
> * *a new continued press (= a tap where there is no release) outside any object*
> * *if the object is Follower, a new continued press on the exact same PioneerFace of the
>   Pioneer object"* — the owner, 2026-09-19

⭐⭐ **`D55`'s SWEEP REACHING `D28`** — the mode toggle was the last rule that still demanded a
RELEASE. ⛔ The rule is `pressTogglesMode` in `mode_toggle.ts`; `scene.ts` gathers the facts only.

⭐⭐⭐ **THE `PioneerFace` CASE GIVES A JOB TO THE ONE PRESS THAT HAD NONE.** Since `A22` a press
on the face already aligned returns `NOTHING` unless it completes a rapid pair. ⚠ After `A23` it
is also the **only safe handhold left on a Pioneer**, so it is now doing two jobs — and
`pressActedOnTheAlignment` is what stops both firing at once.

⛔⛔ **A PRESS ON THE HELD OBJECT ITSELF IS NOT IN THE LIST, AND THAT IS LOAD-BEARING.** Had
`SECOND` been included, the collision below would bite twice as hard.

### ⚠⚠⚠ AND IT COLLIDES WITH `A16`, WHICH IS THE OWNER'S TOO — FLAGGED, NOT RESOLVED

> *"Switching between the two shall indeed require the tap."* — `A16`

⛔ An `OUTSIDE` finger is **the** finger that drives depth or roll — `scene.ts`'s `OUTSIDE`
`POINTERMOVE` branch is *"the only place either is applied"* — and `secondFingerDrive` picks
which by the mode. ⚠ So placing it flips what it will drive:

| | before `D58` | after |
|---|---|---|
| boot in `ROTATE`, place a finger outside | drives **roll** | flips to `TRANSLATE`, drives **depth** |
| lift (a drag, so no tap), place it again | drives **roll** | flips to `ROTATE`, drives **roll** |
| … and again | **roll** | **depth** |

⛔⛔ **The channel therefore ALTERNATES every time the finger goes down, instead of being
chosen** — which is exactly what `A16` reserved a tap for. ⭐ The `PioneerFace` case is clean:
with `pioneerTranslates = 0`, `pinnedSecondDrive` hands over BOTH axes and the mode does not pick.

⭐ **THE ONE-LINE ALTERNATIVE, IF A HAND REJECTS IT**: latch the second finger's channel at its
own press, before the toggle. ⚠ It costs a disagreement between the HUD's mode and what that
finger drives, for the life of the gesture — which is why it was not taken pre-emptively.

### ⛔⛔ THE TAP MUST NOT TOGGLE TWICE, AND ON THE `PioneerFace` IT MUST NOT TOGGLE AT ALL

⚠ A tap is a press **plus** a lift, so without care every tap would flip the mode on the way down
and flip it back on the way up — no change, from the very gesture the owner asked to have an
effect. ⛔ `pressToggled` (a set of pointer ids, cleared on release *and* on a re-press) spends
the release's toggle.

⭐⭐ **AND ON THE `PioneerFace` THE TOGGLE IS ROLLED BACK.** A press there toggles the mode
(`D58`); a *re-tap* there RELEASES the alignment (`D39`). They are the same gesture until the
finger lifts. ⛔ So when the release turns out to have acted on the alignment, the press's toggle
is **undone** and `D39` keeps its single meaning. ⚠ The cost is ~80 ms of the other mode on the
HUD — the same honest flicker `D55` accepted for the cyan that precedes `FOLLOW`, and for the
same reason: *nothing can tell a tap from a press on the way down.*

### ⭐⭐⭐ 5.7 `D59` — AN ALIGNED FOLLOWER GIVES THE SECOND TOUCH **BOTH** AXES

> *"when an object is aligned as follower, currently there are two cases when the second touch is
> pressed outside any object: translation mode — the second touch drives only depth translation;
> rotation mode — the second touch drives only the roll and conflicts with the dx or dy of the
> first touch. I want everything to be aligned with what happens when the second touch hits the
> Pioneer object: whatever translation mode, when an object is aligned as follower the second
> touch shall control the depth and the roll."* — the owner, 2026-09-19

⛔⛔ **THE RULE MOVED FROM *WHERE THE FINGER LANDED* TO *WHAT THE BODY IS*.** `D51` gave both
axes to a finger on the **Pioneer**; the owner has generalised the reason behind it — **an aligned
Follower has one rotational DOF left, so there is nothing for a movement mode to choose between.**
⭐ A free body still has three, and `A16`'s split still earns its keep there.

| second touch | held body | drives |
|---|---|---|
| **outside any object** | **aligned Follower** | ✅ **both** — roll by `dx`, depth by `dy` (`D59`) |
| outside any object | free | the mode picks one (`A16`) |
| on the **Pioneer** | aligned Follower | both (`D51`) |
| on the held object itself | either | the mode picks one — untouched |

⚠ `SAME_OBJECT` is deliberately untouched: the owner's sentence says *outside any object*, and
`A12`'s finger shares a body with the holder, where a diagonal would smear one axis into the other
by accident.

✅✅ **AND IT SETTLES THE `A16` COLLISION `D58` OPENED — for aligned bodies.** `D58` flips the
movement mode when a finger presses outside, and `secondFingerDrive` used that same mode to pick
roll-or-depth, so the channel alternated on every touch. ⛔ Where the mode no longer picks, that
cannot happen. ✅✅ **And the residue on a FREE body is closed by `D61`** (§5.9) — the first outside press of a
hold no longer toggles, so the finger being placed still drives what the mode showed.

✅✅ **AND THE REST OF THAT SENTENCE IS `D60` (§5.8)**: *"… and conflicts with the dx or dy of
the first touch."* ⛔ In `ROTATE`, an aligned body's FIRST touch twists about
the same constraint axis the second touch's `dx` turns — so two fingers drive **one DOF**.
⭐ Matching the Pioneer case **preserves** that overlap rather than removing it: it is present
there too, and it is what the owner asked to be matched. ⚠ Removing it is a separate rule about
what the first touch does while a second is down, and it is not made here.

### ⭐⭐⭐ 5.8 `D60` — AND THE FIRST TOUCH THEN TRANSLATES, WHATEVER THE MODE

> *"… and the first touch shall control the translation with delta position x and y (which is
> currently the case in translation mode but not in rotation mode)."* — the owner, 2026-09-19

⭐⭐ **IT IS `translatesOnDrag`'s OWN RULE WITH ITS REASON GENERALISED**, and that also explains
the owner's observation exactly. Two held objects translate in either mode because *a pair being
moved together is a translation by construction* — so with the second touch **on the Pioneer**
the count is 2 and the wanted behaviour was already there. ⚠ A second touch **outside** leaves the
count at 1, and the mode decided. That is the case being corrected.

⛔⛔ **THE REAL CONDITION IS A DOF BUDGET.** When the second touch owns roll **and** depth
(`D59`), the two fingers already cover the body's whole remaining freedom — first touch x/y in
the screen plane, second touch roll + depth. ⚠ Leaving the first touch on the twist puts **two
fingers on one DOF**, which is precisely the conflict the owner reported.

⚠ **KEYED ON PRESENCE, NEVER ON MOTION** — `A15`'s rule: the second touchpoint being DOWN is a
discrete fact, so the first touch's job changes when a finger lands or lifts, never because
something moved. ✅ The **highlight** reads the same function, so the white contours cannot say
the pair is not being translated while the finger is translating it.

### ⭐⭐⭐ 5.9 `D61` — ON A FREE BODY THE **FIRST** OUTSIDE PRESS OF A HOLD IS INERT

> ⚠⚠ **REPEALED BY §5.13 (`D66`) — and its Follower EXEMPTION is the defect** the two
> fixes of 2026-09-21 were chasing at the wrong event.

> *"when an object is free (not follower), the first time the second touch is pressed outside any
> object shall not trigger a toggle of the translation/rotation mode. This first time the second
> touch is also reset when the first touch releases."* — the owner, 2026-09-19

✅✅ **IT CLOSES THE `A16` COLLISION `D58` OPENED, WHERE `D59` COULD NOT REACH.** On a free body
the mode still picks whether that finger drives roll or depth, so a toggle on its arrival changed
what it was about to do — the channel alternating on every touch instead of being chosen.
⛔ The press that PLACES the finger is now inert; a **second** press during the same hold toggles.
⭐ So switching costs a lift and a re-press — `A16`'s *"switching … shall require the tap"* with a
press standing in for the tap, which is the whole of `D55`'s sweep.

⚠ **A FOLLOWER IS EXEMPT, AND THAT IS THE OWNER'S OWN SCOPING** (*"when an object is free (not
follower)"*). `D59` took the mode out of a Follower's channel selection, so there is nothing left
for a toggle to disturb there.

⭐⭐ **RESET BY CONSTRUCTION.** *"… also reset when the first touch releases"* is not a reset
call: the fact lives on the holder's grip and the grip dies with the finger. ⛔ Nothing calls a
reset, so nothing can forget to — the shape `A13` and defect 40 both punished.

⚠ With MORE than one body held the exemption does not apply: *"is the held body free?"* has no
single answer, and `translatesOnDrag` has already overridden the mode anyway.

### ⛔⛔⛔ 5.10 `D62` — A FOLLOWER MAY APPROACH ITS PIONEER AND NOTHING ELSE

> *"Currently, a Follower can enter in the offset radius of any object and the white highlights
> trigger. I want to restrict this strictly to its Pioneer object (= a Follower object cannot
> approach any other object than its Pioneer)."* — the owner, 2026-09-19

⚠⚠ **IT OVERTURNS `A21`**, which `proximity.ts` quoted verbatim: *"within a SnapIsPossibleRadius
of **ANY** other object (not necessarily the object with PioneerFace)"*. ⛔ Recorded as a reversal
rather than quietly replaced, because the old rule had an argument: *the Pioneer answers which way
is up; the target answers what am I docking with*, and keeping them independent is what let a hand
align against one part and assemble to another. ✅ That freedom is deliberately given up.

⛔⛔⛔ **WIDENED THE SAME DAY, AFTER THE GLASS SHOWED THE OTHER HALF WAS MISSING:**

> *"I want to do the same with Pioneer: currently, when I second touch an object which becomes
> Pioneer, it can white highlight if the Pioneer is close to a third object (which could be not
> the Follower): this should not happen. **the white highlight should be reserved only for
> Pioneer-Follower duo**."* — the owner

⚠ The first build restricted only the **Follower**, because that is the side named first — and a
Pioneer has no Pioneer of its own, so it fell through to *the whole scene*. ✅ Both directions now,
from `AlignmentLinks.partnersOf`: **a Follower's partner is its Pioneer; a Pioneer's are its
Followers; a body in neither role gets an empty set and captures nothing at all.**

⚠⚠ **THAT LAST CLAUSE IS A CHANGE BEYOND THE PIONEER CASE** — an unaligned body used to
highlight against anything and now highlights against nothing. It is the owner's *"reserved only
for Pioneer-Follower duo"* taken at its word, and it is the clause to relax if that reading was
too strong.

⛔ **A MID-CHAIN BODY FOLLOWS, IT DOES NOT LEAD.** With `f → m → P`, body `m` approaches **`P`**,
not `f` — the branch is exclusive. ⚠ The union is the plausible reading and would quietly restore
a third-body capture, so a vector states it.

⛔⛔ **AND THE RULE MOVED OUT OF `scene.ts` BECAUSE A MUTANT PROVED IT HAD TO.** It was a lambda
in the render file, and reinstating the reported defect left **all 944 vectors green**.
⭐ `pioneer_cascade.ts`'s standing rule: *a RULE in a render file is a rule nothing can
interrogate.* Five vectors on `partnersOf` now; the defect is 3 red.

⛔⛔ **A PIONEER OUT OF RANGE CAPTURES NOTHING; IT DOES NOT FALL BACK TO THE SCENE.** A fallback
would make the restriction vanish exactly when the state is surprising, and the contour would name
a body the owner has just forbidden. ⚠ Same for a **stale** link naming a body no longer in the
world: refuse, never widen — `LESSONS_CARRIED` §6.

⚠⚠ **AND THE READOUT OBEYS THE SAME RESTRICTION AS THE RULE.** The HUD's `gap=` now measures to
the **Pioneer**, not to whatever body happens to be nearest. ⛔ Without that a hand would read
`gap=40/70mm` with no contour on the glass, and the number would describe nothing — the
readout-that-lies shape, which has cost this project more than a day.

⚠ The lookup is **injected** into `highlightedPair` rather than reached for: the alignment index
lives in the render layer, and `input/highlight.ts` must not learn to read it.

### ⛔⛔⛔ 5.11 `D64` — DRIVING CONSUMES THE TOGGLE

> ⚠⚠ **SUPERSEDED BY §5.12, THEN REPEALED BY §5.13 (`D66`).**

> *"if the first touch is pressed on follower and then the second touch is pressed, to control the
> follower (on depth or roll), when the second touch is released the mode toggles: it should
> not."* — the owner, 2026-09-21
>
> *"I agree with this recommendation, but make sure you discriminate between a release … and a
> tap or double-tap (a tap or double-tap is a deliberate action and should not be modified at
> this time)."* — the owner, on the fix

⛔⛔⛔ **AND THE DECISIVE PART IS THAT IT DEFEATED `D61` (§5.9).** That rule makes the first
outside press of a hold **inert** precisely so that placing the control finger cannot change what
the finger is about to drive. ⚠ But the **lift** toggled what the press had refused to, so by the
time the finger came back down the mode had flipped anyway: *the channel still alternated on
every touch, one event later.* ⭐ `D61` was postponing its own defect, not closing it.

⚠⚠ **AND THE TOGGLE LIVED ON TWO DIFFERENT EVENTS, CHOSEN BY FACTS A HAND CANNOT SEE** — the
press for an aligned Follower (`D58`), the release for a free body's first press (`D61`) and for
any second touch on the held body (`SECOND` never reaches `pressTogglesMode`'s two branches).
⭐ That is why it read as arbitrary rather than simply wrong.

⛔⛔ **THE §1.3 TAP TEST CANNOT BE THE DISCRIMINATOR, AND THAT IS THE WHOLE DIFFICULTY.** A lift
only reaches this rule when it has **already passed** that test (≤ `tapMaxDuration` 250 ms,
≤ `doubleTapSlop` 8 mm), so *"leave taps alone"* taken literally leaves everything alone. ⚠ And
the two numbers overlap by design — the motion deadband is **3.5 mm** — so one lift can be both a
tap and a control press that moved the body.

✅ **SO THE DISCRIMINATOR IS WHAT THE TOUCHPOINT DID**: a finger that applied any roll or any
depth **spent itself driving**, and its lift is a RELEASE. ⭐ `D38`'s shape — *the alignment
CONSUMES the tap* — and the same reason: one gesture, one consequence. ⛔ The fact is
`applyDepthDrag`'s own return value, so *did this finger drive* has one definition and it is
`A11`'s deadband; no new threshold is introduced anywhere.

⚠ **WHAT STILL TOGGLES, STATED**: a second finger that lands, emits nothing and lifts inside the
tap window. ⛔ Not a residue to be fixed later — it is the case where **nothing distinguishes the
two**, and the owner's instruction says which way it resolves: it is a deliberate tap.
✅ **The double tap is untouched**: the tap history is recorded either way, so the camera reset
pairs exactly as it always has. Only the toggle is spent.

⚠ **NOT EXTENDED TO THE PIONEER-HOLDING FINGER**, which drives a pinned Follower through the same
`applyDepthDrag` and releases through the recognizer's own `TAP` verdict instead. ⭐ The same
argument would apply to it; it was not reported, and a rule that grows itself is how `D48`
happened.

### ⛔⛔⛔ 5.12 `D65` — A SECOND TOUCH RELEASES; IT DOES NOT TAP

> ⚠⚠ **REPEALED BY §5.13 (`D66`) THE SAME DAY** — it aimed at the release; the cause was
> the PRESS.

> *"when I release the second touch (outside of any object), the follower mode changes: fix did
> not solve that. When I release the second touch from the pioneer, it also toggles the follower
> mode: this is not what I want. **Only a tap (or double-tap …) shall toggle the mode. Not a
> release anywhere.**"* — the owner, 2026-09-21, against `a33b485`

⛔⛔ **`D64` (§5.11) IS SUPERSEDED, AND BOTH OF ITS FAILURES WERE PREDICTABLE FROM ITS OWN TEXT.**

1. ⚠⚠ ***Drove* is a per-CHANNEL fact.** On a FREE body the movement mode gives the second finger
   **one** axis, so a finger moved along the other applies nothing, `applyDepthDrag` answers
   `false` **truthfully**, and the lift toggled exactly as before. ⛔ §5.11 called the remaining
   case *"a second finger that lands, emits nothing and lifts"* and judged it rare; on a hand it
   is ordinary.
2. ⛔ **The Pioneer finger was never in the rule.** A press on another body is an `OBJECT` role
   with a grip of its own and releases through the recognizer's `TAP` verdict — a path §5.11
   **flagged and left alone** in the same change. ⭐ `METHOD`, twice over: *a fix that lands
   beside the defect leaves a green suite and a broken product*, and **naming a risk is not the
   same as not taking it.**

✅ **THE RULE NOW: a touchpoint that came down while another finger was already carrying a body
is a CONTROL FINGER, and its lift never toggles the mode** — outside any object or on the
Pioneer, driving or not. ⭐ The fact is *what the touchpoint **is***, latched at its **press**,
which is `IN2`'s own doctrine: a role is decided once, on a discrete event, for the touchpoint's
lifetime. ⚠ Asked at the lift instead, the answer would depend on whether the holder happened to
let go first — the *"differ by timing of the input"* shape `METHOD` names.

⛔⛔ **AND NO GEOMETRY COULD HAVE SEPARATED THEM.** `gainRollDrag` is **2 °/mm**, so **5 mm of
finger is 10° of body** — an effective control press, comfortably inside the **8 mm** tap slop and
the 250 ms window. A brief control press and a deliberate tap are the *same physical event*;
only *which finger this is* tells them apart.

⚠⚠ **THE COST, AND IT GOES BEYOND THE REPORT**: `D58`'s first bullet — *"a tap outside any object
(this is currently what is built)"* — **no longer toggles while a body is held**. ⭐ The
capability survives on the PRESS, where `D58` put the rest of it: the second and later outside
presses of a hold toggle, so switching costs a lift and a re-press (`D61`). ✅ With **nothing
held**, a tap anywhere toggles exactly as it always has (`D27`/`D28`), and the **double-tap camera
reset is untouched everywhere** — the tap history is still recorded at every release, so only the
toggle is spent.

⭐ **Three release sites now ask the same rule** — the two in `noteTap` (`SECOND`, `OUTSIDE`) and
the recognizer's own (`OBJECT`). ⛔ A fourth that forgets to ask is precisely how the Pioneer
finger survived `D64`.

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

⛔⛔ **SUPERSEDED BY `D55`, 2026-09-19 — the premise *"while obj 1 is not aligned"* is now
almost never true.** A second finger pressed on another body aligns on contact, so the pair
lands in `D51`'s configuration immediately: with `pioneerTranslates = 0`, obj 2 does **not**
move and its finger drives obj 1's depth and roll. ⭐ Two holders each moving their own object
survives only where the alignment is refused — a frozen body, no resolved face, a cycle.
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
   ⛔⛔ **SUPERSEDED BY `D71` (2026-09-22)** — *"Set the default to translation mode at scene
   boot."* The session now boots in `TRANSLATE`. ⚠ Kept rather than rewritten: this is the
   record of what was decided, and `METHOD` says a claim that was overturned is more useful
   than one silently deleted.

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


### ⛔⛔⛔ 5.13 `D66` — A PRESS DOES NOT TOGGLE THE MODE; ONLY A TAP DOES

> *"i toggle translation mode, i translate follower with first touch then press second touch
> outside any object then translate in depth with second touch and when i release second touch,
> follower switches to rotation mode."*
>
> *"A press never toggles while a body is held, but a tap by the second touchpoint can (as per
> present rule for tap)."* — the owner, 2026-09-21

⭐⭐⭐ **THE CAUSE WAS NEVER THE RELEASE.** `D58` (§5.6) made a **press** toggle the mode.
`D61` (§5.9) narrowed that to contain the `A16` collision — but **exempted an aligned
Follower**, on the argument that `D59` had left nothing for a toggle to disturb.

⚠⚠ **THE ARGUMENT WAS INCOMPLETE, AND THAT IS THE WHOLE DEFECT.** A toggle on a Follower
disturbs what the **first** touch does *after the second one lifts* — and `translatesOnDrag`
returns `true` for the entire two-finger phase (`D59`/`D60`), so the flip is **invisible while
the gesture lasts**. The mode changed at the press; the hand saw it at the lift.

⛔⛔ **SO TWO FIXES WENT TO THE WRONG EVENT** — `D64` (§5.11) and `D65` (§5.12), each a real
defect on its own path, neither touching the cause. ⭐⭐ **The lesson is about the REPORT**:
*when a rule's effect is masked while a gesture is in progress, a hand can only report the moment
the mask lifts — so the event named in the report is where it became VISIBLE, not where it
happened.* ⚠ The HUD had printed `press outside → ROTATE` the whole time.

✅ **THE RULE NOW, AND IT IS `D28`'s ORIGINAL**: **only a TAP toggles the movement mode**,
wherever it lands and whether or not a body is held — including a tap by the second touchpoint,
*"as per present rule for tap"*. ⛔ A press does nothing to the mode, ever.

⛔⛔ **DELETED, NOT DISABLED**: `pressTogglesMode`, `PressToggleContext`, `D61`'s exemption,
`Held.outsidePressSeen`, `pressToggled`, the PioneerFace re-tap **rollback**, `releaseTogglesMode`
and both facts it was tried on — plus 15 vectors whose subject no longer exists.
⭐ **Everything deleted existed only to contain the press toggle**: the `A16` collision cannot
recur, because placing a finger now does nothing at all.

⭐⭐ **AND IT RESTORES `A16` IN THE OWNER'S OWN WORDS** — *"switching between the two shall
indeed require the tap."* ⚠ What is lost is `D55`'s sweep for this one rule: a press and a tap
are again different things where the movement mode is concerned. ⛔ The alignment's own triggers
are untouched — `D55`, `A22` and `A23` still act on the PRESS.


### ⛔⛔⛔ 5.14 `D67` — THE ROLES ARE INVERTED: FIRST TOUCH THE PIONEER, SECOND THE FOLLOWER

> *"Currently, the follower face selection comes with the first touch and the pioneer face
> selection comes with the second touch. Can i invert? First the Pioneer & PioneerFace, second
> the Follower & the FollowerFace."*
>
> *"As a consequence, the following sequence becomes possible: first touch pressed on PioneerFace
> and remains pressed, second touch is pressed on first Follower object's FollowerFace and then
> released, second touch is then pressed on second Follower object's FollowerFace, etc. which
> enables to select several follower objects to the pioneer object in one go."*
>
> *"to reach the orange, the first touch shall be double tap without final release [on] the
> pioneer object and the second touch shall hit follower object's FollowerFace while first touch
> is still pressed on PioneerFace."* — the owner, 2026-09-21

⭐⭐ **THE SUBSEQUENT TOUCH LOGIC NEEDED NO CHANGE, AND THAT WAS CHECKED RATHER THAN ASSUMED.**
The owner's own condition — *"there shouldn't be [an impact], if the touches are tracked based on
the objects which are tracked"* — holds: `pinnedPair` asks the **links index** which of the two
held bodies follows the other and refuses a cycle, so it never looks at press order;
`secondTouchDrive("PIONEER", …)` already answers `BOTH`; and the only other inputs
(`secondTouchOwnsRollAndDepth`, `translatesOnDrag`) are about a **sole** held grip, where order
cannot enter. ⛔ So after the inversion the Pioneer's finger still drives the Follower's depth and
roll and the Follower's finger still translates it — the same two channels, reached in the other
order.

✅ **WHAT ACTUALLY MOVED** — five things, all inside the creation gesture:

| | before | after `D67` |
|---|---|---|
| PioneerFace | the SECOND touch's face | the **FIRST** touch's face |
| FollowerFace | the FIRST touch's face | the **SECOND** touch's face |
| the frozen refusal | on the held body | on the **pressed** body |
| the cycle guard | *does the pressed body follow the held one?* | *does the **held** body follow the pressed one?* |
| `D39`'s undo | a re-tap on the **PioneerFace** | a re-press on the **FollowerFace** |

⭐⭐ **THE MULTI-SELECT NEEDED NO MECHANISM.** `AlignmentLinks` has always been a two-way index
with a **set** of followers per Pioneer, and the cap of one alignment is per **Follower**, never
per Pioneer. ⛔ One line had to change and it was already there: `alignFollowerToPioneer` clears
the **pressing** grip's `pressFace` — the rule being *a transient grip must not leave a stale
face behind* — and the transient finger is now the Follower's. ⚠ Aimed at the held grip instead,
the second Follower would have failed with *no resolved PioneerFace*: the same line, the wrong
finger.

⭐⭐⭐ **ORANGE IS NOW A PROPERTY OF THE PIONEER'S GRIP.** `pressWasDoubleTap` is latched at that
finger's press (`TapHistory.wouldPair`, a peek and not a record) and read when each Follower is
chosen. ⛔ So every Follower added during one hold comes out the **same colour**, which is what
makes *"several follower objects in one go"* coherent — a `SNAPSHOT` hold and a `FOLLOW` hold,
never a mixture nobody asked for. ⚠ `alignModeFor` is the one place the mapping lives.

⛔⛔ **AND `SWITCH` IS DELETED FROM THE ACTION SET.** It existed because the second touch's tap
count asked for a mode; no touch on a Follower asks for one any more. ⭐ Deleted rather than left
unreachable — an action nothing produces is a branch every reader must consider and no hand can
reach.

⚠⚠ **THE COST A HAND MEETS FIRST, AND IT IS NOT A CORNER CASE**: the base plate is frozen, a
frozen body can never be a Follower, and the Follower is now the **second** touch. So *align a
part to the plate* becomes **hold the plate, then press the part** — the reverse of the habit,
in the scene's commonest gesture. ⭐ The refusal says so out loud
(`align: <id> is FROZEN — it cannot be a follower`) rather than doing nothing.

⚠ **MORE THAN TWO BODIES**: unchanged and re-checked. `alignFollowerToPioneer` still refuses when
more than one *other* body is held (*"N objects held — no Pioneer can be chosen"*), chains are
legal, cycles are refused from the new end, and `D62`'s capture restriction is untouched.

⛔ **WHAT NO VECTOR CAN SEE**: the `pressFace` clearing and the grip flag live in `scene.ts`.
`pressMeaning`/`tapMeaning` carry the decisions and 11 vectors pin them, but *which grip is
cleared* is render wiring — the standing lesson of this branch, and the reason the device pass
must include the owner's exact three-Follower sequence.


### ⛔⛔⛔ 5.15 `D68` — A DOUBLE TAP REVERTS THE MODE EVEN WHEN THE SECOND HALF NEVER LIFTS

> *"if i double tap without release the pioneer and press the follower → orange, the
> translation/rotation mode toggles: it should not toggle. (Note that if I press the pioneer and
> then press the follower → cyan, the mode does not toggle which is correct)."*
> — the owner, 2026-09-21

⭐⭐ **AN INVARIANT BREAK, NOT A NEW RULE — AND THE PARENTHESIS IS THE PROOF.** The cyan route
(press, press) leaves the mode alone, correctly, because neither press toggles anything since
`D66`. ⛔ The orange route is a **double tap whose second half never lifts**, and `D28`'s *two
taps revert* was keyed to the second **release** — which never comes. So the pair left the mode
flipped: half a gesture's worth of state.

✅ **THE COMPLETING PRESS TAKES THE SECOND TOGGLE OVER FROM THE RELEASE.** It undoes what the
first tap did, and its own release is then spent:

| gesture | before | after |
|---|---|---|
| tap | toggles | toggles |
| tap, tap | reverts | reverts |
| tap, press-and-hold (`D67`'s orange) | **flipped** ⛔ | reverts ✅ |

⚠⚠ **AND IT ASKS WHETHER THE FIRST TAP ACTUALLY TOGGLED**, which is a different question from
*was there a first tap*: a tap consumed by an alignment toggles nothing, and undoing it would
flip the mode the hand had. ⛔ `scene.ts` carries that one fact and clears it at every tap
release, both paths; `pairPressRevertsToggle` refuses to infer it.

⚠ `pairReverted` is `pressToggled`'s shape and **not** its rule — `D66` deleted a press that
TOGGLED; this is a press that UNDOES, which is what keeps `D28` true.

### ⛔⛔⛔ 5.16 `D69` — A TRANSLATED PIONEER CARRIES EVERY FOLLOWER, DOWN THE CHAIN

> ⚠⚠ **CORRECTED BY §5.17 (`D70`) THE SAME DAY** — *"all the follower objects"* was read
> literally and the real rule is the symmetry with a turn: a **cyan** Follower is RELEASED.

> *"Currently, if in rotation mode, a rotation of the pioneer controls the same rotation of all
> the orange follower objects. Do the same with translation: a translation of pioneer controls
> the same translation of all the follower objects."* — the owner, 2026-09-21

⛔⛔ **ALL FOLLOWERS, NOT ONLY THE ORANGE ONES — THE OWNER'S OWN CONTRAST, ONE CLAUSE APART**:
*"all the **orange** follower objects"* for the rotation, *"all the follower objects"* for the
translation. ⭐ It is also the reading that makes `D67`'s multi-select worth having: several
bodies chosen in one hold then **move as a group**.
⚠ And it costs nothing geometrically — `SNAPSHOT` versus `FOLLOW` is a statement about what a
**turn** costs, and `FACE_ALIGN` constrains a NORMAL, which no translation can disturb.
⭐ `FollowerMoveLink` has no `mode` field at all, so the distinction is **unrepresentable** here
rather than merely unused.

⭐⭐ **A STATE COMPARISON, EXACTLY LIKE THE TURN CASCADE.** Each link remembers where its Pioneer
was (`PioneerRef.position`, the mirror of `orientation`), and the delta is *where it is now*
minus that. ⛔ **Not** a delta routed from the gesture: a Pioneer may move by a finger, by depth,
by a snap or by its own Pioneer, and a rule that listened to one of those would silently miss the
others — the *substituted quantity* shape this project keeps paying for.
⭐ Chains fall out of the passes, and a vector pins it: `f2 → f1 → p` resolves in ONE call,
because the second pass sees the pose the first one gave `f1`.

⚠ **WHAT CANNOT DOUBLE-COUNT, AND WHY**: with both bodies held, `pioneerTranslates = 0` means the
Pioneer's own finger does not translate it at all — it drives the Follower's depth and roll — so
there is no Pioneer motion to cascade. ⛔ At `pioneerTranslates = 1` the two would add, which is
that selector's business and is stated here rather than discovered.
⚠ A **frozen** body is refused by `object_model`'s writers, so the plate cannot be dragged along
even if something linked it — the guarantee is there and not in the render loop.


### ⛔⛔⛔ 5.17 `D70` — A MOVED PIONEER COSTS A FOLLOWER WHAT A TURNED ONE DOES

> *"there is a difference between modes: in rotation mode, when a follower is cyan, a rotation of
> the pioneer releases the alignment (the follower ceases to be blue). Any other orange follower
> instead rotates to follow the pioneer. In translation mode, when a follower is cyan, it follows
> the translation of the pioneer. This is not OK: a translation of the pioneer should break the
> alignment of the cyan."* — the owner, 2026-09-21

⛔⛔ **`D69` TOOK A CONTRAST FOR A RULE.** The owner's earlier sentence said *"all the **orange**
follower objects"* for the rotation and *"all the follower objects"* for the translation, one
clause apart, and I built the difference. ⚠ It was flagged when it shipped — *"tell me if you
wanted orange only"* — and the answer is sharper than the question: cyan does not merely sit
still, it **breaks**.

⭐⭐ **THE REAL RULE WAS ALREADY THERE, AND IT IS ONE SENTENCE**: a `SNAPSHOT` is a copy taken
**once**, so the moment the Pioneer's pose changes the copy is stale and the relation ends; a
`FOLLOW` is a tie, so it moves. ⛔ **Position and orientation are two components of one pose**,
and a rule that answered differently for each was the asymmetry rather than the fix.

✅ So `pioneerMoved` sits **beside `pioneerTurned`**, takes the mode, and answers in the same
three verdicts — `NONE` / `RELEASE` / `FOLLOW`. ⭐ `METHOD`: *when a rule has two channels, the
correction belongs to the RULE*, which is why this is not an `if` in the cascade.
⚠ The release goes through the **same `releaseAlignmentOf`** the turn cascade uses, so the two
channels cannot leave the index in different states.

⛔ **AND THE EPSILON MATTERS MORE NOW.** `D69` compared positions with `=== 0`, defensibly: the
worst a float wobble could do was nudge a body. ⚠⚠ Under `D70` it would **release an alignment
nobody touched**, so the guard is `PIONEER_MOVE_EPSILON_M` — one micron at metre-scale
coordinates, the mirror of `PIONEER_TURN_EPSILON_RAD`, and NOT a tunable: it guards arithmetic,
not feel. ⭐ Both sides of it are vectored — `1e-7 m` is noise, `1e-4 m` is a hand.


---

## §5.18 — ⭐⭐⭐ THE ALIGNMENT IS **ANTI-PARALLEL** (`D78`, 2026-09-23)

> *"Modify the rule: when the user aligns a follower object, the direction of the FollowerFace
> shall be anti-normal to the direction of the PioneerFace"* — the owner, 2026-09-23

⛔⛔⛔ **IT REVERSES `D37`, WHICH CHOSE PARALLEL DELIBERATELY AND SAID SO.** That decision read
*"the held one makes the minimal turn that points its own face **the same way** (parallel — the
CAD *align* sense, **chosen over a mate**)"*, and this file has carried its consequence ever
since: *the held object presents its opposite side toward the face that was tapped*. ⚠ Both
texts stand. `METHOD`: *a claim that was overturned is more useful than one silently deleted*,
and the earlier one is what explains why the code had the sign it had.

### ⭐⭐ WHAT CHANGES, AND WHAT DOES NOT

| | before | now |
|---|---|---|
| the target direction | the Pioneer's face normal | **its negation** |
| where the follower's face ends up | pointing the same way as the tapped face | pointing **at** it |
| the minimal turn, the cap of one, the free spin | unchanged | unchanged |
| `SNAPSHOT` / `FOLLOW`, the colours, the two undos | unchanged | unchanged |
| the twist about the aligned normal | about the follower's own aligned face normal | the same rule; the body is simply oriented the other way |

⭐⭐⭐ **THE SIGN LIVES IN ONE PLACE — `alignTargetFor`** — and both entry points (`faceAlignConstraint`
at the tap, `retargetAlignment` in the `FOLLOW` cascade) take **the Pioneer's own normal** and
negate it themselves. ⛔ Neither can be handed a ready-made target any more. ⚠ That is
`CONSTRAINTS` §7's instruction applied to a second sign: *a connector stores the TRUE OUTWARD
NORMAL, and one place knows that sign*, because a mate's sign error **cost a live session in the
predecessor**. ⭐ The hazard here is specific and was real before the change: `retargetAlignment`
took a `targetWorld`, so a `FOLLOW` cascade would have re-aligned its followers **parallel** one
frame after a tap aligned them anti-parallel — a sign error with no symptom until the Pioneer
moved.

### ⚠ WHAT IT DOES **NOT** DO

⛔ **It does not make a mate.** Nothing is seated, no position is held, and a body can still be
dragged straight through its partner: `3D2`'s **seat** is what a joint needs, and §4's `6quater`
is still the only rule that would push a `MATE`. ⭐ What the change buys is that the ORIENTATION a
mate needs is now the one the alignment produces — the two faces point at each other — so the
remaining gap is position and a gesture, not geometry.

### ⚠ THE ONE FIXTURE THAT FOLLOWED THE PRODUCT

The approach-swing trial boots with two **pre-aligned** parts, built by aligning the follower's
bottom face to the pioneer's bottom face. ⛔ Under the new sense that would stand the second part
**on its head**, so the boot alignment now uses the follower's **top** face: `anti(−y)` is `+y`,
which is the same physical scene the trial has always had. ⚠ A jig that silently changed shape
would make the swing's device verdicts incomparable with the ones already recorded.


---

## §11 — ⭐⭐⭐ THE FUCHSIA OFFER (`D88`) AND THE SECOND INVERSION (`D87`), 2026-09-24/25

### 11.1 The dictation

> *"in rotation mode, when object is not aligned: track the object's face which first touch
> raycast hit at press = HitFace. During the rotation of the object, highlight in fuchsia any
> face of any other object which normal is aligned within xx degrees of the normal of the
> HitFace. Make xx a slider between 0 and 45 degrees with 5 degrees increment … Add a white ring
> at the center of the fuchsia highlighted face … if one fuchsia highlighted face is pressed by
> second touch, it becomes PioneerFace and the object becomes Pioneer object … and the object
> with HitFace becomes aligned Follower object and the HitFace becomes FollowerFace."*

### 11.2 ⛔⛔⛔ *ALIGNED WITHIN xx DEGREES* IS READ AS **ANTI-PARALLEL**

⚠ The word admits two readings 180° apart, and this is the one thing to check with a hand. The
build implements the **mate** sense — the candidate face pointing back **at** the HitFace —
because `D78` made the alignment itself anti-parallel, so the parallel reading would light the
faces a press is about to turn the body **away** from. ⭐ If the owner meant the other one it is a
single sign in `facesMate`, and every other vector in `tests/face_candidates.test.ts` survives it.

### 11.3 What the HitFace is, and what it is not

⭐ It is **the first touch's own raycast answer**, latched at the press (`grip.pressFace`) and
never recomputed — a second opinion about *which face* would be free to disagree with the one the
press already recorded. ⛔ Three refusals, all read live: no holder, no raycast hit, or **the body
is already aligned** (it owns a FollowerFace and a highlight; a second meaning on one body is what
`D42`'s colours exist to avoid). ⛔⛔ The `ROTATE` precondition of the dictation is **deleted** —
the owner, 2026-09-25: *"no need to be in ROTATE for hitFaceNow()."* It was mine, not his: I read
the mode he happened to be describing it in as a condition of the rule.

### 11.4 `D87` — THE SECOND INVERSION, AND WHY THE FEATURE FORCED IT

> *"currently, the pioneer is pressed first and the follower is pressed second. Invert that order.
> That will allow to align a hitface with a pioneer face."*

⭐⭐ **The offer and the press that accepts it are now ONE gesture.** The fuchsia set is defined on
the **held** body's HitFace and lights faces on **other** bodies; under `D67`'s ordering the press
that accepted an offer had to mean the opposite of the press that made it — the held body was the
Pioneer, so pressing a fuchsia face would have made the OFFERING body the Follower of the face it
was being offered. ⚠ One ordering, one meaning: *hold the part, press what you want it aligned to.*

⚠⚠ **Cost, and `D67` was chosen for exactly it**: several Followers could be aligned to one
Pioneer **in one hold**. Inverted, the single held body is the Follower and a Follower is capped at
one alignment, so each pair needs its own hold. ⛔ The pairs are all still reachable.

⚠ **The frozen plate changes sides too.** Under `D67` it was HELD, and `D77` leaves the first touch
alone. Inverted it is PRESSED — and `D77` turns a second touch on a frozen body into a MISS. ⭐ So
`pressHit` takes an `offeredFace` argument: a face the product is currently OFFERING in fuchsia is
admitted. Aligning to the plate now reads *turn the part until the plate's face lights, then press
it*, and `D67`'s *hold the plate FIRST* is superseded.

### 11.5 ⛔⛔⛔ THE FIRST DEFECT OF THE INVERSION — **TWO FACE NAMESPACES**

> *"I hitface face1, I align face1 with pioneerface (OK), I hit face2, I align face2 with
> pioneerface (OK), I hit face1 again, I align face1 with pioneerface → in this last case, instead
> of aligning, it disengages the alignment and it goes back to face1 fuchsia highlight. Why?"*
> — the owner, 2026-09-25

⭐ `pressMeaning` has one configuration that deliberately does **nothing**: *this held body already
follows this pressed body, on this very face* — the press does nothing and the RELEASE undoes it
(`D39`), so a hand that presses and holds has not silently lost the alignment it is looking at.

⛔⛔ Under `D67` its two terms named faces of the **same** body. Inverted, they name faces of **two
different bodies** — and face ids are per body (`f0…fN`, `mesh_topology.ts`), so `objectA/f4` and
`objectB/f4` are different faces with the same string. The third press in the owner's sequence hit
that collision, returned `NOTHING`, fell through to `D39`'s release and **broke** the alignment.

✅ The test now requires **three** terms — same Pioneer body, same Pioneer face, **and** same
HitFace on the held body — so nothing is compared across namespaces. ⭐ `METHOD`: *an identifier
that is only unique within a scope becomes a defect the moment a rule reaches across scopes, and
the reach is invisible because both sides are typed `string`.* Two vectors, both shown RED against
the two-term rule.

### 11.6 The toggle, and what it does **not** disable

⭐ `?pioneerCandidates=0` switches off **the two downstream actions only** — the fuchsia
highlights on other bodies and the press that promotes one to PioneerFace. ⛔ The owner, on my
first over-reach: *"I did not tell to disable the hitFaceNow and I still need the hitface and the
fuchsia contour."* The HitFace and its own fuchsia contour are unconditional.

### 11.7 — ⛔⛔⛔ `D89`: `D77`'s CARVE-OUT FOLLOWS THE **ROLE**, NOT THE FINGER

> *"why I cannot select frozen object as a pioneer?"* — the owner, 2026-09-25

⭐ Two rules, neither of which mentions the other, composed into a third behaviour that neither
names:

* `D77` — *a **second** touch on a frozen body is a MISS*, so a finger resting on the plate drives
  the held part instead of being wasted. ⚠ It spared the **first** touch for exactly one reason,
  stated in its own text: `D67` had put the **Pioneer** on the first touch, so the plate had to
  stay holdable or it would have left the alignment model entirely.
* `D87` — the Pioneer is the body being **pressed**, i.e. the second touch.

⛔⛔ So `D77` went on guarding the finger the Pioneer had **left**. The plate was reachable only
through `D88`'s fuchsia exception, and turning the offer off (2026-09-25) removed even that.

#### ✅ The owner's choice, of three

⭐⭐ **The two touches swap.** A **first** touch on a frozen body is the useless one now — a held
body is the FOLLOWER, and a frozen body is refused that role, so holding the plate cannot produce
any alignment at all. It becomes the miss, and that finger goes to work as an `OUTSIDE` touchpoint,
which is the whole of `D77`'s intent aimed at the finger that now qualifies. ⛔ Every **later**
touch keeps its hit — the third and fourth as well, because those are presses that can name a
Pioneer, and refusing them would put the plate out of reach for any hand already using two fingers.

⚠⚠ **The cost, named before it was chosen**: a finger resting on the plate while a part is held now
latches the plate (role `OBJECT`) and selects it as a Pioneer, instead of driving the held part's
roll or depth. ⛔ That is `D77`'s original complaint, in the one configuration that matters. The
owner took it against the two alternatives — gating on the mate GEOMETRY, or leaving the fuchsia
fill as the only way in.

✅ `D88`'s `offeredFace` parameter is **deleted** with it: it only ever widened the second touch,
which is admitted outright now, and a parameter nothing can reach is the dormant-fork shape.

#### ⭐⭐⭐ THE SHAPE

*A guard written in terms of WHICH FINGER is a guard that a role inversion silently aims at the
wrong one.* ⛔ Nothing could go red: `D77` stayed exactly as true as the day it was written, about
a finger that had stopped mattering. ⚠ The tell was a question from a hand — *why can I not select
the frozen object* — not a failing test, and no test in this repository could have asked it.

### 11.8 — ⭐⭐⭐ `D90`: THE SWAP, AND THE LAST RULE STILL SPEAKING `D67`

> *"I align follower to pioneer, I release both touches, I then first press the pioneer and second
> press the follower (different faces): the pioneer and the follower remain unchanged and the
> follower updates the followerface. Why? Why is there no swap between the pioneer and the
> follower? This conflicts with the rule I set."* — the owner, 2026-09-25

⭐ Two rules produced that between them, and both were `D67`-shaped.

#### 11.8.1 The press refused it

`pressMeaning` ended with *the body being pressed already follows the held one, so aligning the
held one to it would close a loop* — `A` follows `B`, the hand holds `B` and presses `A`, so the
verdict was `NOTHING`.

⛔⛔ **That guard was right under `D67`, and only under `D67`.** There the held body was the
**Pioneer**, so *hold B, press A* meant **`A→B`** — the relation that already existed. Not fresh,
and letting `wouldCycle` fire on it broke the pair the hand was holding, which is a defect the
glass reported within minutes. ⚠ Inverted, the identical finger pattern means **`B→A`**: the
opposite relation, and a legitimate swap.

⭐⭐ **A SWAP CANNOT CLOSE A LOOP**, because a Follower is capped at one alignment and `link`
*moves* rather than adds: the ring needs `A→B` to survive `B→A`, and it does not. ✅ So
`AlignmentLinks.cycleBreaker` names **whose alignment must be released** for the link to be legal —
the prospective Pioneer's own — and `scene.ts` severs it and then makes the alignment.

⛔ **One release always suffices**, and that is why there is no loop: a body has at most one
Pioneer, so the chain leaving the prospective Pioneer is unique and cutting its first edge severs
every cycle through it. `F → P1 → P2` then `P2 → F` drops `F → P1`, exactly as the two-body case
drops `A → B`.

⚠ **It reverses the owner's own earlier sentence** — *"a follower cannot become the pioneer of its
own pioneer; in such case, the tap shall instead break the initial alignment"* (2026-09-17), which
said break and **stop**. ⭐ Both texts stand. `METHOD`: *a ruling is made about a gesture, and an
inversion changes what the gesture says — so the ruling has to be asked again, not carried.*

#### 11.8.2 And the release then did `D67`'s job

With the press declining, `tapMeaning` ran on the lift — still written the old way round, reading
the **tapped** body as the Follower and the **held** one as the Pioneer. It saw `A` already
following `B` but on a different face, called that a fresh alignment, and re-pointed `A` onto the
face just pressed. ⭐ That is the *"the follower updates the followerface"* in the report: not a
rule about faces, but the old trigger still running.

✅ **Its `ALIGN` is DELETED, not inverted.** Since `D87` the **press** aligns, on the way down, and
`pressActed` spends the release (`D55`). The only press that declines and still wants a consequence
is the one that would change **nothing** — and that one wants `D39`'s undo. ⛔ A second alignment
path was never a feature; it was `D67`'s trigger left running, and it is what made this report look
like a rule about faces.

⭐ What `tapMeaning` is now: `D28`'s mode toggle, except for the exact-match no-op, where it
releases **the held body** — the Follower, which is the body that owns the alignment. ⚠ It released
the *tapped* body until `D90`, which under `D87` would break the Pioneer's own relation to some
third body, one the hand never touched.

#### 11.8.3 ⭐⭐ WHERE THE DECISION LIVES

`cycleBreaker` is in `core/alignment_links.ts` and `scene.ts` holds only the two calls. ⛔ The
policy used to be four lines of render code, which is the 2026-09-19 shape exactly: *a rule written
in `scene.ts` is a rule nothing can interrogate.* ⭐ Four mutants now go red on it, including one
that survived the first fixtures — see the ledger.

### 11.9 — ⭐⭐ `D95`: A TAP ON EMPTY SPACE RELEASES THE HELD BODY'S ALIGNMENT

> *"Add the following conditions to unalign an aligned object (in addition to existing conditions):
> first touch pressed on aligned object and single tap with second touch not raycast hitting any
> object (for mobile device); right button clicked and hold on aligned object and then left click
> not raycast hitting any object (for desktop)."* — the owner, 2026-09-25

⭐⭐ **ONE RULE, BECAUSE THE TWO ARE ONE CONFIGURATION.** On the desktop the right button's hold IS
the first touch (`D94`), and a left click that hits nothing IS a second touch routed `OUTSIDE`. So
the mouse needs no rule of its own — `outsideTapReleases` in `input/alignment.ts`, called from the
`OUTSIDE` release in `scene.ts`.

⛔ Exactly one held body, and it must be aligned. ⚠ With a free body the tap keeps its old meaning,
`D28`'s mode toggle. ⭐ The tap is CONSUMED — it releases and does not also toggle the mode (`D38`'s
*one gesture, one consequence*); the tap history is still recorded, so a double tap still pairs.

⭐ **The unalign gestures now**, all of them: re-press the same pair on the same faces (`D39`);
shake the Follower; shake the Pioneer (all its followers); turn or move the Pioneer of a cyan
follower; flick the Follower within the gesture that aligned it; align it to something else; and
**a tap on empty space while holding it** (`D95`).

### 11.10 — ⭐⭐⭐ `D96`: THE PIONEERFACECURSOR

> *"When aligning, create an object PioneerFaceCursor: it shall be a green ring and it shall be
> placed at the center of the PioneerFace by default. Destroy it … when un-alignment occurs and
> this PioneerFace is cancelled. … there can be several PioneerFaceCursors … and they can also have
> the same position … implement a proper tracking."* — the owner, 2026-09-25, then *"the ring shall
> be amber instead of green"* and *"the ring shall always be in the screen view plane"*.

⭐⭐ **ONE CURSOR PER ALIGNMENT, KEYED BY THE WHOLE COUPLE** — follower + FollowerFace + pioneer +
PioneerFace (`core/pioneer_face_cursors.ts`). ⛔ Not one per Pioneer face: `pioneerFaces()`
de-duplicates, which is right for a contour and wrong here — two Followers on one face own two
rings at one position. ⭐ A Follower re-aligned on ANOTHER face (either side) is a different couple,
so its old ring is destroyed and a new one made at the new face.
⭐ **Reconciled against the links every frame** and **disposed** when its couple goes, whatever
removed it — retired by membership, the 2026-09-17 lesson. ⚠ A surviving cursor is the SAME object
frame to frame, so a moved position persists.

**The drag** (the owner, same day): *"when left button clicked inside the PioneerFaceCursor
(desktop) or first or second touch pressed within a certain distance from the PioneerFaceCursor
(mobile) … translate the PioneerFaceCursor on top of the PioneerFace surface … it cannot exit an
edge … if the surface is not flat, the PioneerFaceCursor position shall follow the surface."*

| | rule | where |
|---|---|---|
| grab | mouse: LEFT button INSIDE the ring (radius 8 px); touch: within `pioneerCursorGrabRadii` × radius (1–10); nearest wins; never the synthesised second touch | `input/pioneer_cursor_grab.ts` |
| claim | the pointer is taken **before the router** — it selects, orbits, taps and counts as nothing else, until it lifts | `scene.ts` `cursorPointer` |
| move | RELATIVE: the grab offset is kept, so a press several radii away does not jump the ring | `scene.ts` |
| place | the ray's nearest hit on the face's TRIANGLES (two-sided); on a miss, the plane through the cursor, pulled back to the nearest surface point — bounded by the edges, on the surface when it is not flat | `core/face_surface.ts` |
| toggle | **FACE ALIGNMENT › *Free Flow mode (PioneerFaceCursor drag on/off)*** (`pioneerCursorDrag`, `D101`) — ⛔ **ships OFF**, the owner's *"default is cursor drag off"*; at 0 nothing grabs | FACE menu |

⚠ Costs, unjudged: the ring sits at the face CENTRE, so with the drag ON a press meant for that
face's centre grabs the ring instead — wider reach, more often; and 8 px is a small mouse target.
⛔⛔ **AND THE RING IS NOT PARENTED** — a billboard parented to a body loses the body's ROTATION
(defect 71), so it is placed in world space every frame.

### 11.11 — ⭐⭐ `D97`: AN ALIGNED FOLLOWER'S TRANSLATION AXES

> *"those axis are displayed whenever the aligned follower object is touched or left clicked (not
> necessarily when a movement occurs) in whichever mode. If in horizontal plane translation (first
> touch or left click without shift), always show the red and blue axis. If in gravity axis
> translation (second touch or left click + shift), always show the green axis, or only the grey
> axis if the roll rotation is ongoing. Do not show the axis as full screen length … show length
> corresponding to the segment between the FollowerFace center (the origin of the axis) and the
> projection of the position of the PioneerFaceCursor onto this axis."* — the owner, 2026-09-26

| held aligned Follower | red + blue | green |
|---|---|---|
| first touch / left click alone | ✅ always | — |
| + a second touch / Shift | — | ✅ always, ⛔ unless a roll has turned it **during this hold** and the grey is up |

⭐ Decided by which touches are DOWN, not by what moved — `alignedTravelAxes` in
`input/aligned_axes.ts`. A second touch is `OUTSIDE` (a finger, or the mouse's Shift touchpoint) or
`SECOND` on the same body. ⭐ Each line is a SIGNED segment from the FollowerFace centre to the
cursor's projection (`segmentTowardCursor`), zero-length when the cursor is square to the axis.
⛔⛔ **The rotation lines are untouched** — the owner: *"do not modify anything about the rules for
the display of the rotation axis"* — so grey/purple/maroon stay `displayedAxes`'s, and a free body
keeps the old travel rule and its full-screen lines.
⚠ *"Ongoing"* is read per HOLD because `displayedAxes` keeps its last answer across holds: a roll
from an earlier gesture must not hide the green on a fresh one.
⛔ **Desktop, 2026-09-26**: *"when I release the shift and left click is still pressed, the gizmo is
stuck on the green."* The Shift touchpoint is tied to the LEFT button (it lifts with it, so a
released Shift cannot read as a tap), so its presence is not the answer: `secondTouchDown` counts it
only while Shift is HELD, which the mouse layer reports from pointer and key events.

### 11.12 — A RE-ALIGNMENT TURNS MINIMALLY FROM THE LAST *ALIGNED* ORIENTATION

> *"when a follower rotates to align its follower face, the rotation shall be minimum from its last
> aligned quaternion … when I align the same follower face to another rectangle face, the roll
> reappears and I lose the perpendicularity."* — the owner, 2026-09-26

⭐ **Checked, and the rule already held** — `solve` swings minimally from the body's current
orientation, which is its last aligned one. ⛔ **One gap closed**: a re-alignment made while the
previous snap was still animating (~130 ms) solved from the HALF-TURNED pose; it now solves from the
snap's end (`AlignSnaps.targetOf`) and still starts drawing from the drawn pose.
⚠⚠ **THE LOST SQUARENESS IS THE GEOMETRY, MEASURED**: a Follower square to the plate, re-aligned by
the minimal turn to the grey part (booted 30° roll + 30° pitch), lands **8.2°** (top face),
**17.6°** (side) or **30.0°** (end) off square to it — two turns about different axes carry a
twist about the face normal that no single shortest swing can reproduce.
⭐⭐ **THE OWNER CHOSE THE SQUARING TWIST** (*"add that squaring twist"*): after the swing the
Follower turns about the aligned normal by the smallest angle — **≤ 45°** — that squares its edges
to the Pioneer's (`squaringTwist`, `input/alignment.ts`). The normal is untouched and the spin
about it stays free; ⚠ the total turn is no longer strictly minimal, by the owner's choice.

### 11.13 — ⭐⭐⭐ `D100`: THE SNAP, THE SEAT AND THE UNSNAP — BUILT 2026-09-26

> *"Snap conditions: if the center of the followerFace is within an offset radius distance from
> the PioneerFaceCursor, and the anti-normals of the pioneerface and followerface are within the
> fuchsia angle cone, the followerface snaps the pioneerface. Snap = followerface normal anti-align
> with PioneerFace normal and followerFace center sets at the position of the PioneerFaceCursor
> which consequently drives the position of the follower object. All the movements to be lerp and
> slerp. Once snapped, the follower object follows the transform of the Pioneer object (= similar
> to a child object) and can still be rotated around the followerFace center around the
> followerFace normal axis. To unsnap: first touch on pioneer object and second touch on follower
> object and one rapid zoom out movement (same sliders as eviction shake) or first right click hold
> on pioneer object + second left click hold on follower object + rapid delta position."* — the
> owner, 2026-09-26 (the unsnap order corrected the same day, *"to maintain symmetry between mobile
> and desktop"*)

| | rule | where |
|---|---|---|
| **may it snap** | only an ALIGNED couple (the cursor exists per alignment); ⛔ after an unsnap, **held off until the couple has left the offset radius once** (re-arm on exit, `3D3`'s) | `input/snap.ts` `SnapArming` |
| **does it snap** | FollowerFace centre within the **capture offset** (mm on the glass → world metres, the white contour's own number) of the cursor, AND the normals within the **fuchsia cone** (`pioneerCandidateConeDeg`) of anti-parallel. ⭐ No new number | `snapConditionMet` |
| **the snap** | the orientation is the alignment's slerp (already anti-parallel); the position **lerps** the face centre onto the cursor on the same clock and easing; ⚠ a flight retargets if the cursor or Pioneer moves | `input/seat_snap.ts` |
| **the seat** | on landing the Follower becomes a **CHILD** of its Pioneer (`object_model.attach`, `3D1`'s tree) and the link is marked seated. Every frame its LOCAL placement is **re-derived** from the cursor: `position = cursor − rotate(orientation, faceCentre)` — so the face centre is on the cursor by construction, a twist about the normal is a turn **about the face**, and a dragged cursor (Free Flow) carries the body | `core/seat.ts`, `scene.ts` `syncSeats` |
| **what a seat refuses** | its own translation (reported: *"seated — move its Pioneer, or unsnap"*); the turn and move cascades skip it (the tree carries it); the sway treats the assembly as one body; a press on the partner aligns/swaps/undoes **nothing** | `applyWorldStep`, `followerLinksFrom`, `receivesSway`, `pressMeaning` |
| **what ends a seat** | the **unsnap**; a release of the alignment; a re-alignment; a prune — each un-parents the body where it stands | `unseatWorld` |
| **the unsnap** | FIRST holder on the Pioneer, SECOND on its seated Follower (both devices), then within the eviction shake's `evictShakeWindowMs` a growth of the fingers' **separation** by `evictShakeLegMm` (tablet, *zoom out*) or a **travel** of the driven pointer by that leg (mouse) | `input/unsnap.ts` |

⚠⚠ **NOT BUILT, deliberately**: the **approach** — the offset-radius zone still only lights the
white contour (*"for the moment, we are not using it"*), the swing trial ships OFF, and no mate
connector is pushed: the seat is the tree plus a retargeted `FACE_ALIGN`, and `core/mate_connector.ts`
stays unwired.
⚠ Costs, unjudged by a hand: the white capture contour still lights on a seated pair (gap zero);
a seated Follower held in TRANSLATE shows its axes but moves nothing; the frozen plate is a
parent, never a child, so a part seats ON it and the plate cannot seat on anything.

#### 11.13.1 — ⭐⭐ `D102`: THE ASSEMBLY DRIVES AS ONE BODY, THE MAGNET, AND 15 mm (2026-09-26)

> *"Set the default offset radius to 15 mm. Make the snap translation movement faster and more
> abrupt so the user can feel as if there was a magnet effect. When the follower is snapped to the
> pioneer, they shall be treated as a whole during rotation and translation (although the capacity
> to unsnap shall remain). In particular, when translating, the faces of the pioneer and follower
> shall be part of the same object and the gizmo shall reach any face (except the parts which are
> occulted in the PioneerFace and FollowerFace). Also, the follower shall be raycast hittable to
> receive the input as part of the same object."* — the owner, 2026-09-26

| | rule | where |
|---|---|---|
| **the press drives the ROOT** | a press on any member of a seated assembly holds the top-most Pioneer reached by walking seated links up; the tree carries the members, so translation, yaw/pitch/roll, twist and the second finger's channels act on the whole. ⛔ The walk **stops below a frozen Pioneer**: a part seated on the plate holds the part (translation refused, twist free) | `input/assembly.ts` `assemblyRoot` |
| **the raw face** | the member face the finger touched is kept beside the drive body: the **gizmo anchors there** (*"reach any face"*; the two mating faces are inside the assembly and cannot be hit). ⛔ It is NOT a HitFace — face ids are per body — so an assembly is aligned by a ROOT face only | `Held.rawPress` |
| **the unsnap, redirected** | the second touch on the seated Follower now arrives as a `SECOND` on the root; the gesture reads the RAW pair (first the Pioneer, second the Follower) and the second's own samples; a member seated on the frozen plate stays a separate holder and the two-holder form serves it | `feedUnsnap` |
| **a frozen Pioneer is holdable** | only while a seated Follower rests on it — the unsnap's first touch; a bare plate's first touch is still `D89`'s miss. ⚠ Cost: a finger resting on a loaded plate holds it instead of orbiting | `frozenHoldAdmitted` |
| **the magnet** | the position half of a snap has its own time, **`snapMs` = 60 ms** (slider 0–400, below the sway radius), and `magnetEase = u²`, which accelerates INTO contact; the orientation keeps the alignment's slerp | `seat_snap.ts` |
| **15 mm** | `captureOffsetMm` ships at 15 again (15 → 4 → 5 → 15 in one day): the radius is the snap's reach now. ⚠ The tilted pyramid captures the plate at boot again — the vector's fourth reading | `gestureConfig.ts` |

⚠ Unjudged by a hand, all of it. ⚠ What a seated member held in `TRANSLATE` shows is now the
assembly's axes at the touched face.
