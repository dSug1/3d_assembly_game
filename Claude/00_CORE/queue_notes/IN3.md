# `IN3` — rules 1–3 (one touchpoint)

**Status: not built.** Blocked on `3D1` for everything that touches a real object model.
This dossier exists ahead of the build for one reason: a decision has already been taken
that `IN3` will have to resolve.

## ⛔⛔ THE DOUBLE-TAP COLLISION — decide this before writing rule 2septies

**The spec (§1.4) makes a double-tap the ONLY way a constraint is ever evicted.**

**But since 2026-09-14 a double-tap ALSO resets the camera orbit**, anywhere on the
glass — on an object or not. That is the owner's call, and the reason is reachability:
the orbit can get stuck close in with an object filling the view, and in that state every
tap lands ON something. A reset that only listened to empty space would be unreachable
exactly when it is wanted.

⚠ So when `IN3` builds constraint eviction, one of the two has to give:

* the same double-tap does **both** — evict the constraint *and* reset the camera; or
* the reset moves to a gesture of its own (a triple tap, a two-finger double-tap, a
  button); or
* eviction moves instead.

⛔ **It must be decided, not discovered.** Today the reset fires on every `DOUBLE_TAP`
verdict in `scene.ts`, so whichever way it goes, the change is one branch — but if
eviction is written without looking here, the two will silently both fire and the user
will lose a constraint every time they straighten the view.

⭐ Note also that the tap history is **shared across every touchpoint** (`TapHistory` in
`recognizer.ts`, one instance in `scene.ts`). It was briefly split so object taps and
empty-space taps could not fuse; the owner overruled that — *"no discrimination inside or
outside any object"* — so a double-tap that straddles an object's edge counts as one
gesture, which is what a hand means by it.
