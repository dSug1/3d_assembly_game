# 30 — OBJECTS & ASSEMBLY · connectors, constraints, meshes

> **STATUS** · ⭐ active · **OWNS** · the object model, mate connectors, the
> constraint solver, mesh import
> **READ IF** · you are touching assembly, connectors or the object tree
> **LAST VERIFIED** · 2026-09-15

## Where it stands

✅ **`3D0` built and carried**: `src/core/mate_connector.ts` and
`src/core/constraint_stack.ts`, transliterated from a **shipped, live-confirmed**
Python implementation that was written dependency-free precisely so it could move.
Covered by 14 vectors.
✅ **`3D1` BUILT 2026-09-15** — `src/core/object_model.ts`, **42 vectors**, engine-free:
`id`, `local` placement, `parent`, faces (centre + outward normal, what 6bis reads),
connectors, and the constraint stack attached to the object. ⭐⭐ **`reroot` is rule 3 made
executable** — it re-points the chain onto the held object while every object's world
placement stays put, and *grabbing a child moves the whole assembly* is a vector by name.
⭐ Every fixture is THREE deep, and the deep-chain vector goes to 16.
⛔ **BUILT, NOT CLOSED**: no visible behaviour means no device look is possible; `IN3`
wires it and closes it. ⛔ No snapping — that is `3D2`.

## ⛔⛔ The four rules that must not be rediscovered

Each cost a live session in the predecessor.

1. ⛔⛔ **A connector stores the TRUE OUTWARD NORMAL, so a mate is ANTI-PARALLEL.**
   It is the opposite of the first natural wording. `mateFacingCos` must be negative,
   and `testMate` **throws** if it is not — the sign is enforced, not documented.
2. ⛔⛔ **Break on the RESIDUAL of the unconstrained desires, never the observed
   gap.** Once mated the gap is zero *by construction*, so a gap-based break test can
   never fire and the mate is unbreakable. `mateResidual` takes **desired** poses for
   exactly this reason, and returns linear and angular **separately** — summing them
   needs a length scale, and inventing one hides which term broke the mate.
3. ⭐⭐ **Parent ≠ root.** The parent (the bigger object) *stores* the relative
   transform and is static; the **root** is whoever is currently held, re-rooted every
   frame. Conflating them means grabbing a child moves nothing.
4. ⭐ **`rollOrder` is what makes a mate FASTENED rather than REVOLUTE.** Normals
   alone leave the roll about the contact axis free.

⭐ And one from the renderer: **ONE SCENE CAMERA, never one per object.** Two
projections for one scene drew coincident faces 18.4 px apart.

## The constraint stack

Owner's spec §1.4, implemented in `src/core/constraint_stack.ts`. Entry 1 is **hard**
(the swing, 2 DOF), entry 2 is **soft** (the twist, 1 DOF), entry 3 is **rejected** by
default. ⛔ A `WORLD_AXIS_ALIGN` stores a **world** vector resolved at snap time —
storing the screen axis meant a later camera orbit silently redefined the constraint.

⭐ `bestTwist` is closed-form, not a search: a numeric sweep would introduce a step
size, and a step size is a threshold nobody measured.

## ⚠ Carried forward unclosed

* **The assembly tree has never held more than two objects** (`3D5`).
* **The capture/preview radius has no measured floor** — it was the predecessor's
  last unmeasured constant too.
