# THE SCORE — touchpoint episodes and elapsed time, against an absolute optimum

> **STATUS** · ⛔ **SPECIFIED, NOT BUILT** (2026-09-26) · **OWNS** · the score's definition and its build list
> **READ IF** · you are about to build the snap, the touch ledger, the solver, the timer or the HUD score
> **LAST VERIFIED** · 2026-09-26

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

The pictured final configuration: the pyramid seated on the plate, the grey part standing on the
pyramid, the pink cuboid on the grey part — every FollowerFace centred on its PioneerFaceCursor.

---

## 2. DEFINITIONS

| term | meaning | where it already exists |
|---|---|---|
| **touchpoint episode** | one touchpoint from its **press to its release**, whatever it did — a hold, a tap, a drag, a second finger, or a touch that moved nothing | `IN2`'s router latches every touchpoint at press; the mouse layer synthesises the same touchpoints (`D94`), so a left drag, a right hold and a Shift second touch are each one episode |
| **boot configuration** | the scene as the page loads: every part's placement, nothing aligned, `TRANSLATE` (`D93`) | `core/scene_dims.ts`, `bootTilt` |
| **final configuration** | owner-authored per scene: for each part, **which face is seated on which Pioneer face**, **where on that face** (the PioneerFaceCursor's position), and **which of the four square spin positions** | ⛔ not built — data, not code |
| **snap** | **automatic**, once conditions the owner will define are met (distance, cone angle, …); it seats the FollowerFace centre on the PioneerFaceCursor; ⛔ **it is not an episode** | ⛔ not built (`3D2`) |
| **unsnap** | a **touchpoint episode** the owner will define; it un-seats | ⛔ not built |
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

---

## 4. WHY THE SNAP IS A PREREQUISITE, AND WHAT IT CHANGES

⛔⛔ Without a snap, *"matching the PioneerFaceCursor"* is not reachable by hand — a continuous drag
never lands exactly — so the final configuration cannot be detected and no count is defined.

⭐⭐ **A seated Pioneer carries its followers** (the owner's decision). Today an alignment is a
frozen world direction and only `FOLLOW` (amber) carries a rotation, not a position (`D42`); a seat
is a rigid relationship. ⛔ That is `3D1`'s assembly tree — parent ≠ root, built and vectored — so
the seat makes the Follower a **child** of the Pioneer rather than adding a third alignment mode.
⚠ The consequences to settle when it is built: what `SNAPSHOT`/`FOLLOW` mean for a seated pair
(probably nothing — a seat supersedes both); whether a shake on a seated Pioneer still releases
followers (`A17`) or only the unsnap does; and that the sway must treat a seated assembly as one
body (`receivesSway` already spares the mover's Pioneer).

⚠ The approach is **not finalised** ([`../../10_INPUT_TOUCH/spec/APPROACH_AND_MATE.md`](../../10_INPUT_TOUCH/spec/APPROACH_AND_MATE.md)
§6.3, and the swing trial ships OFF). It is the next thing to build, with the snap.

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
| align it (press the Pioneer face while holding) | 1 | `D87`, one press |
| bring it to the cursor | 1 | a second finger for gravity while the hold drags horizontally — the two channels sum in one episode (`D43`); the snap seats it for free |
| wrong square quadrant after the squaring twist (`D98`) | +2 | a tap to `ROTATE`, a twist drag |
| mode toggle | 0 today | boot is `TRANSLATE` and an aligned body translates in any mode (`D60`) |
| unsnap | 1 | never on the optimal path of a well-posed scene |

⭐ The pictured configuration, under those costs: **9 episodes** (three parts × hold, press, second
finger). ⚠ Order matters and the solver must model it: a seated Pioneer carries its followers, so
building from the top down is legal but costs no less; a `SNAPSHOT` Pioneer moved later releases its
follower, which costs a re-align.

---

## 6. WHAT NEEDS TO BE BUILT, IN ORDER

| # | what | needs | falsified by |
|---|---|---|---|
| 1 | **The approach and the snap** (`3D2`): the conditions (distance, cone angle, …), the seat onto the PioneerFaceCursor, the Pioneer carrying its followers via the tree, the **unsnap** episode | the owner's conditions and the unsnap gesture | a hand: a part that snaps outside the conditions, or fails to inside them; a moved Pioneer whose follower stays behind |
| 2 | **Final-configuration data** per scene: face pairs, cursor positions, spin quadrant — and its **detector**, read from the model every frame | 1 | a scene reported complete with one part unseated, or a spin quadrant off by 90° |
| 3 | **The touch ledger**: one count per touchpoint episode at the router, started at the first press after boot, printed on the HUD | — (can be built first, it is one counter) | a mouse Shift second touch counted differently from a finger; an episode missed on a lost `pointerup` |
| 4 | **The timer**: first press after boot → detection; on the HUD | 2 | a timer that runs before the first press or after detection |
| 5 | **The solver** in `src/core`, vectored against hand-worked optima, including the pictured 9 | 2, and the costs above kept in one place | a hand-typed optimum; a solver that disagrees with a hand-worked sequence |
| 6 | **The score**: episodes vs optimum, the bonus on equality, the time; **Free Flow** voids it | 2–5 | a score shown while Free Flow is on |

⛔ Each is a queue row in Phase GAME; this file is their dossier until one outgrows it.

---

## 7. OPEN, AND THE OWNER'S TO DECIDE

- The snap's conditions, and the **unsnap** gesture.
- Whether the solver's optimum is shown to the player before, after, or never.
- How episodes and time combine into one rank, if they must (⭐ two readouts and no formula is the
  honest first build; a formula is a guessed number).
- Whether the PioneerFaceCursor positions of a scene are the owner's only, or the player may move
  them in a scored game (⛔ today moving one is Free Flow, so no).
