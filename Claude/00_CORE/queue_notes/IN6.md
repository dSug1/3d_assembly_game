# IN6 — Undo

> **STATUS** · built, unjudged · **OWNS** · the scene's undo history
> **LAST VERIFIED** · 2026-09-28

## `D111` — one scene history (2026-09-27)

A double tap on a body undoes the last ACTION — a gesture that changed the model (a move, a turn, an
alignment, a snap, an unsnap, a release) — and again goes further back. A snapshot is taken when the
first pointer goes down and pushed when the last lifts, if the model changed. → `ALIGNMENT_RULES.md` §13.

## ⭐⭐ `D141` — only on the body that moved (2026-09-28)

> *"a double click or double tap reset to the previous only if it is done on the same object which has
> moved"* — the owner

⭐ Each history entry now records the bodies its action TOUCHED (`bodiesTouched`, `core/undo_history.ts`):
every body whose WORLD pose changed — a seated child carried by its root included — or whose parent or
constraints changed; and, for an action that moves nothing but changes an alignment (an unsnap, a
release), the Follower whose link or seat changed (not its Pioneer). A double tap undoes only if the
tapped body is among them (`undoAllowedOn`); elsewhere it is refused with the HUD naming the body that
moved, and the entry stays (`peek`). ✅ 6 vectors (`tests/d141.test.ts`). ⛔ Unjudged by a hand.
