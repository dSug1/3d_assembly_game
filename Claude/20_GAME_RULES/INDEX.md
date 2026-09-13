# 20 — GAME RULES · how the game behaves, in plain language

> **STATUS** · ⚠ empty by design · **OWNS** · the behavioural record
> **LAST VERIFIED** · 2026-09-13

Nothing is scheduled here yet. The game layer waits on `IN` and `3D`.

⭐ **What this folder is FOR, and why it exists on day one.** In the predecessor, the
behaviour of the thing was scattered across a spec, a queue and a session log, and
answering *"what is the game supposed to do when X"* meant reading three files and
reconciling them. A single plain-language behavioural record fixed that. Start it the
day the first rule exists, not later.

⚠ It describes **behaviour**, not mechanism: *"an object released inside another's
capture radius seats into it"*, not *"`testMate` returns `withinRadius`"*. When the
two disagree, this file is the requirement and the code is the bug — or the file is
out of date, which is itself the finding.
