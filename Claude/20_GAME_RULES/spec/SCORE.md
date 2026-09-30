# THE SCORE — touchpoint episodes and elapsed time, against an absolute optimum

> **STATUS** · 🔨 **PARTLY BUILT** (2026-09-27): the snap, seat and unsnap (`D100`), the touch ledger and the HUD's first line — episodes + timer (`D112`/`D115`, `GM2`); ⛔ NOT built: the final-configuration detector, the solver's optimum, the score · **OWNS** · the score's definition and its build list
> **READ IF** · you are about to build the snap, the touch ledger, the solver, the timer or the HUD score
> **LAST VERIFIED** · 2026-09-27

⭐ Created 2026-09-26 from the owner's proposal and decisions. ⛔ The build queue is
[`../../00_CORE/QUEUE.md`](../../00_CORE/QUEUE.md), Phase GAME; this file is the record those rows point at.

---

## 1. THE OWNER'S TEXT — verbatim, 2026-09-26

> *"Here is a proposed final configuration with all follower faces aligned and matching with
> pioneerfacecursors. Given a boot configuration and a final configuration (to be defined by the
> owner for each scene of the game), is there a way to compute the absolute least inputs quantity to
> be actioned by the user to achieve final configuration from boot configuration? Then, during the
> game: users with least inputs actioned win, and win bonus if user actual inputs actions quantity
> equals absolute least inputs quantity."*

> *"1- One touchpoint episode: agreed. 2- Snap: we will define it, but it will be automated provided
> some conditions are met (distance, cone angle, etc.) so it will not count in the touchpoint
> episodes. Also, the snap will entail that the Pioneer that moves later will carry its follower(s).
> That may impact the build. Unsnap will be also defined and will be through a touchpoint episode.
> We shall reward the user based on the number of touchpoint episodes to reach the final
> configuration (user's episodes count vs. absolute least episode count) and also based on time
> elapsed to reach the final configuration (that will take care of the long sloppy drags or whatever
> else increases the elapsed time). Also, rename the slider PioneerFaceCursor drag on/off to Free
> Flow mode (PioneerFaceCursor drag on/off): we will have the possibility for the user to escape the
> score system and enter a Free Flow mode where the user can build his own scene by moving the
> objects around (of which, moving the PioneerFaceCursor is a first step)."*

> *"Update the score rule: a touchpoint to rotate the camera shall not count as a touchpoint
> episode. Any touch or click (button, shift, etc.) to toggle between rotation/translation in
> whichever mode (aligned, unaligned, etc.) shall not count as touchpoint episode: make the list of
> these cases to exclude from touchpoint episode."* — the owner, 2026-09-26, later the same day

> *"A touchpoint to zoom in / out shall also be excluded."* — the owner, the same day

> *"C2: I consider shift to be a toggle of axis within a movement which is already engaged: this
> shall not count. Same for second touch on mobile device if this second touch toggles the axis
> within the movement which is already engaged. C3: a third touchpoint the router ignores: shall
> not count (this is not reproducible on desktop)."* — the owner, the same day

> *"This shall be unsnap: 2. However, there is another way to unsnap: 1 by flicking the snapped
> object. This is fair, because the second way is more brutal (it also unsnaps any follower which
> were aligned with the object being unsnapped): it costs less but is less chirurgical."* — the
> owner, the same day

The pictured final configuration: the pyramid seated on the plate, the grey part standing on the
pyramid, the pink cuboid on the grey part — every FollowerFace centred on its PioneerFaceCursor.

---

## 2. DEFINITIONS

| term | meaning | where it already exists |
|---|---|---|
| **touchpoint episode** | one touchpoint from its **press to its release**, whatever it did — a hold, a tap, a drag, a second finger, or a touch that moved nothing — ⛔ **except the camera and mode-toggle cases of §3.1**, which are not episodes | `IN2`'s router latches every touchpoint at press; the mouse layer synthesises the same touchpoints (`D94`), so a left drag, a right hold and a Shift second touch are each one episode |
| **boot configuration** | the scene as the page loads: every part's placement, nothing aligned, `TRANSLATE` (`D93`) | `core/scene_dims.ts`, `bootTilt` |
| **final configuration** | owner-authored per scene: for each part, **which face is seated on which Pioneer face**, **where on that face** (the PioneerFaceCursor's position), and **which of the four square spin positions** | ⛔ not built — data, not code |
| **snap** | **automatic**, once conditions the owner will define are met (distance, cone angle, …); it seats the FollowerFace centre on the PioneerFaceCursor; ⛔ **it is not an episode** | ✅ built (`D100`) — capture offset + snap cone, `input/snap.ts` |
| **unsnap** | a **touchpoint episode** the owner will define; it un-seats | ✅ built (`D100`), costs **1** (`D115`); the flick-unsnap is deleted (`D110`) — `input/unsnap.ts` |
| **the optimum** | the **absolute least number of episodes** from boot to final, computed by a solver | ⛔ not built |
| **Free Flow mode** | the user leaves the score and builds freely; dragging the PioneerFaceCursor is its first freedom | the FACE ALIGNMENT slider *Free Flow mode (PioneerFaceCursor drag on/off)*, `pioneerCursorDrag` |

---

## 3. THE SCORE

1. **Episodes**: the player's episode count from the first press after boot until the final
   configuration is detected, against the optimum. ⭐ Fewer is better; **equal to the optimum wins
   the bonus**.
2. **Time**: elapsed from the first press after boot until the final configuration is detected.
   ⭐ This is what punishes a long sloppy drag, so the episode count never has to.
3. ⛔ **Free Flow escapes the score.** Switching it on during a game voids that game's score rather
   than pausing it — the cursor can then be moved, which changes the final configuration itself.

⚠ An episode that does nothing still counts. That is deliberate: a fumbled touch is an input the
hand made, and exempting it would need a rule for *"did nothing"* that every gesture would have to
agree on.

### 3.1 ⛔ WHAT IS **NOT** AN EPISODE — the owner's two exclusions, as the list of cases

⭐ A touchpoint is classified by **what it resolved to at its release** — a tap and a drag are the
same press until then — using the router's role and the recognizer's verdict the build already has.
Everything not listed here counts.

**A. The camera** — *"a touchpoint to rotate the camera shall not count"*, *"a touchpoint to zoom
in / out shall also be excluded"*:

| case | how it arrives today |
|---|---|
| A1 | the **orbit**: one touchpoint on empty space with **nothing held**, dragged (rule 1) — ⚠ also when it did not move, since with nothing held it can be nothing else |
| A2 | the **zoom**: the pinch — two touchpoints on empty space with nothing held (rule 4) — both excluded; ⚠ `A5`'s depth pinch on a HELD body moves the body and is not this |
| A3 | the **camera reset**: a double tap on empty space with nothing held — both taps excluded (each is also a toggle, B1) |
| A4 | desktop: the **left drag on empty space** with nothing held (A1), and the **wheel** — which is not a touchpoint at all |

**B. The mode toggle** — *"any touch or click to toggle between rotation/translation in whichever
mode"*. ⭐⭐ Narrowed by `D108` (2026-09-27) to ONE gesture, so the list shrank with it:

| case | how it arrives today |
|---|---|
| B1 | tablet: a **tap by the second touchpoint on empty space** while ONE free body without followers is held — the only toggle |
| B2 | desktop: **Ctrl** at the left press — a modifier, like Shift (D1), never a touchpoint |
| B3 | the two taps of a double tap that flips the mode twice (also A3 when on empty space) — ⚠ since `D108`/`D111` only on EMPTY space with a free body held; a double tap on a BODY is the **undo** (§5) |

⚠ A tap with nothing held, or on a body, toggles nothing now — it is still excluded where A3 or D3
covers it, and otherwise counts as a fumble (C2).

**D. An axis toggle within a movement already engaged, and an inert touchpoint** — the owner's
C2/C3 rulings:

| case | how it arrives today |
|---|---|
| D1 | desktop: the **Shift** touchpoint while the left button holds a body — it switches the engaged hold's channel (horizontal → gravity, or → roll), so it is a toggle of axis, not a movement of its own |
| D2 | mobile: the **second touch that toggles the axis** of an engaged hold — a finger on empty space (or on a frozen body — every press on one is a miss, `D119`) driving gravity or roll, or on the held body itself (`SECOND`) |
| D3 | a **third touchpoint the router ignores** (`IGNORED`) — it can do nothing; ⚠ not reproducible on desktop |

⭐ So on both devices the hold is the episode, and whatever the hand adds to steer it is free. ⛔ A
second touch that **presses a Pioneer face** is not this — it aligns (C3).

**C. What still counts, stated so the boundary is sharp:**

| case | why |
|---|---|
| C1 | `D95`/`D107`'s **tap on empty space while holding an aligned body or a Pioneer** — it un-aligns, which is assembly, not a toggle |
| C2 | a **hold** that moved nothing, any fumble that is not D3 — §3's rule |
| C3 | every hold, align press, drag, twist and unsnap (the shakes and the flick are deleted, `D107`/`D110`) — ⭐ a two-touch action (align, unalign, a Pioneer's release, unsnap) is ONE, landing when its last touch lifts (`D115`); the undo pair counts ONCE (`D111`); a cursor drag is Free Flow and counts nothing |

⛔ **The ledger must classify with the same functions the gestures use** — `tapTogglesMode`, `outsideTapRelease`, the
router's roles, the recognizer's verdict — never a second copy of *"is this a tap"* (`D60`'s
lesson: two implementations of one fact disagree exactly when one is fixed).

---

### 3.3 ⭐⭐ DESKTOP ↔ MOBILE — THE SAME ACTION COSTS THE SAME (measured headless, 2026-09-29, after `D161`)

> *"list the actions with space in desktop and compare with the mobile configuration, in particular episode counts, to make sure there is equivalence"* — the owner, 2026-09-29

| action | desktop | mobile | episodes (both) |
|---|---|---|---|
| select, then release, doing nothing | click + unclick; right click + Esc; Space alone | touch + release | **0** |
| move a part | left drag | one-finger drag | **1** |
| align | Space + click the part (or right click it), then a plain click on the Pioneer face; or right HOLD + left click | hold the part, second finger taps the Pioneer face | **1** |
| move, then align in the same action | drag, Space mid-drag, then a plain click on the Pioneer face | drag, and while still holding, second finger taps the Pioneer | **1** |
| press still, then align | left press, Space, then a plain click on the Pioneer face | hold, second finger taps | **1** |
| unalign | Space + click (or right click) the aligned part, then a plain click on empty space | hold the aligned part, second finger taps empty space | **1** |
| cancel a latched HitFace | a plain click on the same part, or Esc | lift the finger | **0** (after a press held still); **1** if the part had moved first |
| a double tap / double click that undoes nothing | double click | double tap | **0** |

⭐ Every row was driven in a headless Chrome on `Scene_0` (a fresh boot per case; the mobile cases with real touch events, two fingers where the gesture has two) and the episode delta and `objectA`'s alignment read back. ⚠ Two of MY instruments were wrong on the first run and are not the product: a synthetic `touchEnd` lifted the holding finger instead of the tapping one (CDP's `touchEnd` names the ENDED points), and a left press sent with the mask `1` while the right button was held told the layer the right had been released. ⛔ A device look is still owed on every row.

### 3.2 ⭐⭐ `D158` — A GESTURE THAT LANDS NOTHING COSTS NOTHING (2026-09-29)

> *"an action which does not land into anything (for example: space pressed with no further action, left or right click and unclick on an object, touch and release on an object) should count as zero episode"* — the owner, 2026-09-29

⭐ When a gesture's last touch lifts, its cost lands only if it CHANGED THE MODEL — the undo layer's own comparison of the bodies, the alignments, the seats and the cursors before and after (`endGesture`). So an align, an unalign, an unsnap, a move and an undo land; a press and release on a body, Space with nothing after it, a Space click cancelled by Esc, a drag that crossed no rotation increment and a double tap or click that does not land (`D157`, absorbed) cost ZERO. ⭐ The undo pair still costs ONE (`D111`): its first tap changed nothing, its second tap's gesture undid. ⛔ `D157`'s take-back and `undoSecondTap` are deleted with it, and so is `D155`'s continuation mark: a press held still + Space + an alignment costs 1 (the alignment), a drag that MOVED + Space + an alignment costs 2 (two things landed). ⛔ **Reversed by `D159` the same day**: a Space freeze carries the gesture, so drag + Space + the action that follows lands ONCE — 1 if anything changed (alignment, or the move then Esc), 0 if not. ✅ `EpisodeTally.gestureEnded(changed)`, 4 vectors; headless, each case measured.

### 3.4 ⭐⭐⭐ `D187` — AN EPISODE LANDS WHEN ITS ACTION IS TRIGGERED (2026-09-30)

> *"the episode count shall be incremented at the first touch or click or delta position which triggers an action which
> will increment the episode count, not at the release of the touch or click. For example: left click pressed / first
> touch on an object does nothing (because the user can still release the input) but as soon as the delta position
> translates / rotates the object, the count shall be incremented."* — the owner, 2026-09-30

* ⭐ WHAT an action costs is unchanged — `episodeCounts` per touch, `max(holds, actions)` per gesture (`D115`: a two-touch
  action is ONE), and a gesture that changes nothing costs nothing (§3.2). ⭐ WHEN it lands changes: the frame the gesture
  FIRST CHANGES THE MODEL — a drag's first step past the deadband, an alignment, an unsnap, an undo — not the release.
* A touch is classified at its PRESS (`EpisodeTally.touch`, keyed per press) and again at its release, which replaces
  the press record (an unalign tap only counts once it has unaligned). The render loop asks `sync` every frame with
  `gestureChangedSoFar` — `endGesture`'s own comparison, latched once true; the release asks it too.
* ⭐ A later action in the same hold lands when it adds to the cost (a hold with two actions: 1, then 2).
* ⛔ What has landed is never taken back: a part dragged and brought back to where it started still cost one.
* ⛔ It revises `D115`'s *"count the episode only when the last of the two touches is released"*; the HUD's
  `(+n on release)` is deleted. ✅ Measured in the real app (a DevTools mouse drag on Piece2): 0 after the press held
  still, **1 with the button still down** after the drag, 1 after the release, and a click that moves nothing adds 0.

## 4. WHY THE SNAP IS A PREREQUISITE, AND WHAT IT CHANGES

⛔⛔ Without a snap, *"matching the PioneerFaceCursor"* is not reachable by hand — a continuous drag
never lands exactly — so the final configuration cannot be detected and no count is defined.

⭐⭐ **A seated Pioneer carries its followers** (the owner's decision). Today an alignment is a
frozen world direction and only `FOLLOW` (amber) carries a rotation, not a position (`D42`); a seat
is a rigid relationship. ⛔ That is `3D1`'s assembly tree — parent ≠ root, built and vectored — so
the seat makes the Follower a **child** of the Pioneer rather than adding a third alignment mode.
⚠ The consequences it had to settle: `FOLLOW` is deleted (`D106`) — a seat supersedes it; the
Pioneer shake is deleted (`D107`), so only the unsnap or a tap releases; and that the sway must treat a seated assembly as one
body (`receivesSway` already spares the mover's Pioneer).

✅ **The snap, the seat and the unsnap are built** (2026-09-26, `D100`) — the rules are
[`../../10_INPUT_TOUCH/spec/ALIGNMENT_RULES.md`](../../10_INPUT_TOUCH/spec/ALIGNMENT_RULES.md) §11.13.
⚠ The approach is **not built**; the white zone highlights and the swing trial are deleted (`D120`).

---

## 5. THE OPTIMUM — how it is computed

⭐ A shortest path over an abstract state per part — *aligned to (face)*, *seated*, *spin
quadrant* — with the gesture vocabulary as moves and **episodes as cost**. For three to six parts
the search is exhaustive. ⛔ Engine-free, in `src/core`, with golden vectors against hand-worked
optima; and **never a hand-typed number per scene** — that fixture goes stale the day a gesture rule
changes (defect 66's shape).

The costs the solver reads, under today's rules:

| step | episodes | why |
|---|---|---|
| hold a free part | 1 | the first touch |
| align it (press the Pioneer face while holding) | **+0** | ⭐⭐ `D115` (2026-09-27): a two-touch action is ONE episode — the press uses up the hold it pairs with, and the pair lands when the LAST touch lifts. ⚠ It was +1 (`D87`, one press) |
| bring it to the cursor | 0 | the hold already engaged drags horizontally; the second finger for gravity is an axis toggle within it (§3.1 D); the snap seats it for free |
| wrong square quadrant after the squaring twist (`D98`) | +0, time only | a tap to `ROTATE` (excluded, B) and a twist by the hold already engaged — it costs seconds, never an episode |
| mode toggle | 0 | excluded by rule (§3.1 B) — and unneeded anyway: boot is `TRANSLATE` and an aligned body translates in any mode (`D60`) |
| camera orbit, pinch, reset | 0 | excluded by rule (§3.1 A) — so looking around is free and the solver never has to model the view |
| **unsnap**, the precise way | **1** | ⭐⭐ `D115`: hold the Pioneer + touch the seated Follower is one two-touch action; the rapid move is inside the second. ⛔ It was **2** (`D103`) — the owner, 2026-09-27: *"Make sure these actions also have one episode count"*. ⚠ Formerly: 1 if the Pioneer was already held |
| **undo** — a double tap on any body (`D111`) | **1** | both taps together; the undone action's own episodes stay counted |

⭐ The pictured configuration, under those costs: **3 episodes** (three parts × one hold-and-align
action, `D115`) — ⚠ it was 6 with the press priced apart, and 9 before the owner's C2 ruling freed the second finger. ⭐ So under these rules
the episode count is a count of **presses that change the assembly**, and everything about *how*
a part is steered is paid in time. ⚠ Order matters and the solver must model it: a seated Pioneer carries its followers, so
building from the top down is legal but costs no less; a `SNAPSHOT` Pioneer moved later releases its
follower, which costs a re-align.

---

### 5.1 ⛔ THE FLICK-UNSNAP IS REMOVED (`D110`, 2026-09-27)

*"Flick un-snap D103: obsolete. Remove"* — the precise unsnap (1 since `D115`; it was 2) is the only one, and the flick is
deleted with it. ⭐ The player's cheap way back is now the **undo** (1, `D111`), which reverses the
last action whole — seats included — rather than releasing a chain of them.

## 6. WHAT NEEDS TO BE BUILT, IN ORDER

| # | what | needs | falsified by |
|---|---|---|---|
| 1 | **The approach and the snap** (`3D2`): ✅ the snap, the seat and the precise unsnap are BUILT (`D100`); ⛔ owed: the approach | — | a hand |
| 2 | **Final-configuration data** per scene: face pairs, cursor positions, spin quadrant — and its **detector**, read from the model every frame | 1 | a scene reported complete with one part unseated, or a spin quadrant off by 90° |
| 3 | ✅ **BUILT** (`D112`, 2026-09-27) — **The touch ledger**: one count per touchpoint episode at the router, classified at release by §3.1 (`input/episode_ledger.ts`), started at the first press after boot, printed as the HUD's FIRST line with the timer | — (can be built first, it is one counter) | a camera orbit or a mode-toggle tap counted; a mouse Shift second touch counted differently from a finger; an episode missed on a lost `pointerup` |
| 4 | **The timer**: first press after boot → detection; on the HUD | 2 | a timer that runs before the first press or after detection |
| 5 | **The solver** in `src/core`, vectored against hand-worked optima, including the pictured 6 | 2, and the costs above kept in one place | a hand-typed optimum; a solver that disagrees with a hand-worked sequence |
| 6 | **The score**: episodes vs optimum, the bonus on equality, the time; **Free Flow** voids it | 2–5 | a score shown while Free Flow is on |

⛔ Each is a queue row in Phase GAME; this file is their dossier until one outgrows it.

---

## 7. OPEN, AND THE OWNER'S TO DECIDE

- ~~The snap's conditions, and the **unsnap** gesture.~~ ✅ decided and built (`D100`, `D115`).
- Whether the solver's optimum is shown to the player before, after, or never.
- How episodes and time combine into one rank, if they must (⭐ two readouts and no formula is the
  honest first build; a formula is a guessed number).
- Whether the PioneerFaceCursor positions of a scene are the owner's only, or the player may move
  them in a scored game (⛔ today moving one is Free Flow, so no).
