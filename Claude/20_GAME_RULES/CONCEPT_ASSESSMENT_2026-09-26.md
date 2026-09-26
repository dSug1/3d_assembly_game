# CONCEPT ASSESSMENT — what is missing between the build and a game (2026-09-26)

> **STATUS** · ⭐ an assessment, written at the owner's request · **OWNS** · nothing binding
> **READ IF** · you are deciding what to build after the snap
> **LAST VERIFIED** · 2026-09-26

⛔ **This is not a queue.** The build list is [`../00_CORE/QUEUE.md`](../00_CORE/QUEUE.md) and
nowhere else. Every item below is a candidate; it becomes work only when the owner adds a row
there, and the row IDs quoted here (`GM1`, `RND2`, `3D3`, …) are the existing ones.

⭐ Written after reading the charter, the constraints, the queue, the input specification's
build inventory and the source tree, one day after the snap, the seat and the unsnap landed.

---

## In one sentence

**The project has a very well-engineered manipulation engine and, as of this week, a first working
assembly mechanic; it does not yet have a game.** That is where the record itself says it stands:
Phase GAME holds five queued rows and nothing built.

---

## What is missing, in the order to tackle it

### 1. A core loop a player can complete

A session today has no beginning, no goal and no end. The score specification
([`spec/SCORE.md`](spec/SCORE.md)) defines what winning means, but nothing detects it and nothing
celebrates it. ⭐ The five `GM` rows are the right list; build **`GM1`** (final-configuration data +
detector) and **`GM2`** (the touch ledger) first, and ship a single level with a *done* screen before
any further input refinement. Until a player can **finish** something, nothing else can be judged.

### 2. A content pipeline — which means levels

Four hard-coded bodies and no mesh import (`3D4`) is one level, forever. ⭐ The fix is half-designed
already: **Free Flow mode is the level editor.** Extend it to save a scene — boot layout, final
layout, cursor positions — as a local JSON file, and load scenes from files. No network egress is
needed (`CONSTRAINTS` §5 stays true). Ten authored levels of rising difficulty will teach more about
the concept than another month of gestures.

### 3. Playtesting by strangers

Rule 5 has been one finger, the owner's, on one tablet: every gesture is tuned to the hand that
designed it. ⭐ Five people who never read the rules — including children, with consent, since the
audience is all-public — given three levels and a stopwatch, will show which gestures survive
contact. The score specification already provides the metrics: episodes and time.

### 4. A smaller gesture vocabulary for the first hour

Roughly fifteen gestures exist: the mode-toggle tap, hold + press to align, the double press for
`FOLLOW`, the shake, the flick, the twist, the roll, the second finger's gravity, two unsnaps, the
pinch, the orbit, the camera reset, the cursor drag, and Shift on the desktop. For *all public,
including youth* that is a lot, and the queue already flags one of them in the owner's own words:
*"this is a complicated movement to execute by the user."* ⭐ Decide the **five** a first-time
player needs, introduce them one per level, and hold the rest back or cut them. The engineering need
not change; the **exposure** does.

### 5. Feel and feedback

Everything on screen is diagnostic: a HUD text block, cyan/amber/fuchsia/white/grey outlines, a
tuning menu. There is no sound, no haptic, no success animation, no failure signal. `IN7`'s negative
haptic, `RND2`'s mate preview and `RND4`'s off-screen indicator are queued and are the right ones.
⭐ The magnet snap (`D102`) was the first *feel* decision; a designed visual language has to replace
the debug colours before anyone outside the project sees the game.

### 6. A theme, or a hook

Minimal-moves assembly is a spatial-reasoning puzzle — a good genre (ustwo's *Assemble with Care*
is the obvious reference). But blocks on a plate have no reason to exist. ⭐ Assembled objects that
**do** something when complete — a mechanism that turns, a toy that works — give the snap a purpose
and the level a payoff. ⛔ This is the one item no session can build: it is the decision that makes
a game rather than a demo, and it is the owner's.

### 7. Undo and restart

A score that counts episodes punishes mistakes, so a player needs a cheap way back: an **undo**
(the last episode) and a **level restart**. Neither exists.

### 8. The business model, decided early

No ads and no analytics are binding (`CONSTRAINTS` §5 — and right, for a youth title), so the
options are a paid app or paid level packs. ⭐ That choice sets how many levels the launch needs, so
it belongs now, not at store submission (`SEC1`).

---

## Two engineering risks that will bite the game layer

* ✅ **DONE the same day (`D104`)**: `src/render/scene.ts` was ~7,900 lines; it is a 1,118-line
  composition root plus thirteen modules now, so a game feature has a file of its own to land in.
* **The tree has never held more than three bodies, and every collision shape is convex** (`3D5`).
  The first imported mesh — curved, hollow or L-shaped — will test `mesh_topology`, GJK and the seat
  at once. ⭐ Plan one deliberately ugly real part as a test asset early.

---

## Still owed on the mechanics, from the queue

The **approach** (the zone only lights white today); **break on residual** (`3D3`); the
**flick-unsnap** (`D103`, specified, not built); and a decision on the **mate connectors**, which the
cursor-based seat has quietly replaced — either wire them or delete `core/mate_connector.ts`, so the
record stops promising them.

---

## A suggested order, for the owner to accept or rewrite

1. Split `scene.ts` · 2. `GM1` + `GM2`, one level with a *done* screen · 3. Free Flow as a level
editor with local save/load · 4. Five levels, five gestures, a stranger playtest · 5. Sound, haptic,
the mate preview, a visual language · 6. The theme, and the business model — in parallel with 4–5,
because both are the owner's, not a session's.
