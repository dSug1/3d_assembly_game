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
🔌 **WIRED 2026-09-15**: `scene.ts` builds a `World` and **every rule writes the model** —
rule 6's translate, the rotation rules, §1.3's rollback and §2 rule 1's barycentre. ⭐ The
render loop is now the SINGLE writer of a mesh transform, which removed the held-mesh
exception and the barycentre's defensive sway subtraction at the same time.
✅✅ **CLOSED 2026-09-15** — *"locked/jumping fix is working"*, after the pass found **one
defect, in the wiring**:
the render loop drew only objects that happened to have a *follower* entry, a map populated
lazily by the sway and the rotation rule. When the model became authoritative that implicit
invariant died silently — a translated object was **locked**, then **jumped** once something
else created its entry. ⭐ Fixed (the loop now iterates the model) and **confirmed by the hand that found it**.
⛔ 409 vectors passed before and after the fix: the iteration set is in `src/render`, on the
far side of the boundary, which is why a device look is what closes a change.
✅ Everything else was clean, which **re-confirms rule 6** after its path was rewired.
⛔ No snapping — that is `3D2`.

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
