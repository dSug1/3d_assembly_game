# QUEUE.md blocks spent on 2026-09-27

> **STATUS** · history · moved out of [`../QUEUE.md`](../QUEUE.md) when the inputs were simplified
> (`D106`–`D124`). ⛔ Nothing here is current: `FOLLOW`, both shakes, the re-tap undo, the white
> capture contours and the swing are deleted; the snap and seat are built (`D100`).

### ⭐⭐⭐ WHAT IS OWED NEXT, IN ORDER (2026-09-17)

1. ⛔⛔ **APPROACH & MATE — THE HIGHLIGHTS AND THE ALIGNMENT TRACKING ARE BUILT; THE APPROACH IS NOT** (`D46`–`D48`, `A16`–`A21`, 2026-09-17). ✅ On the glass: white capture contours on a near pair (**translating + within `4L`**), every aligned body keeping its FollowerFace **and** a coloured body outline, a shake on a Pioneer releasing **all** its followers, a turned Pioneer releasing its cyan followers and rotating its orange ones **down a chain**, no cycles, and a **frozen** base plate. ⛔ NOT built: the approach, the hold-off, `SnapIsAuthorized`, the snap, the mate, the break.
   ⭐ New engine-free modules: `core/proximity.ts`, `core/alignment_links.ts`, `core/random_pose.ts`, `input/highlight.ts`, `input/pioneer_cascade.ts`, plus `frozen` in `core/object_model.ts`.
   ⛔⛔ **THREE DEVICE REPORTS, EACH FINDING SOMETHING NO TEST HERE COULD**, and `METHOD` gained a shape from each: *a fix that lands beside the defect leaves a green suite and a broken product*; *when two readings fit one device report, name both*; *a second symptom that contradicts your theory is worth more than a third that confirms it.* → spec §14 and [`../../10_INPUT_TOUCH/INDEX.md`](../../10_INPUT_TOUCH/INDEX.md).
   ✅✅ **THE CAPTURE IS A SURFACE GAP** (`D49`/`D50`, 2026-09-18): white is decided by the gap between the bodies' **surfaces**, from geometry **computed at spawn**; the threshold is **millimetres on the glass** scaled by camera distance, on a slider; and every outline and face marker is built from the **mesh topology**, not a bounding box. ⛔ The approach DIRECTION stays on centres — face-to-face collapses at contact → spec §19–§20.
   ⭐ Scene: three `L × 2L × 3L` parts `5L` apart at seeded random orientations (`?sceneSeed=N`), a **frozen** `6L × 0.3L × 9L` base plate `3L` below, camera at half max zoom-out. Ordered device lists: §12–§18 of [`../../10_INPUT_TOUCH/spec/APPROACH_AND_MATE.md`](../../10_INPUT_TOUCH/spec/APPROACH_AND_MATE.md).
   ⛔ **Next**: the approach itself (4b.1), then `3D2`'s seat + the mate, then `D47`'s break. ✅✅ **THE LATENT DEFECT THAT WOULD HAVE ARMED WITH THE FIRST MATE IS CLOSED** (audit, 2026-09-17): three guards read `stack.length === 1` meaning *"is this body aligned?"* and fell through to FREE rotation otherwise. ⭐ `rotationChannel` answers `FREE` / `TWIST` / **`REFUSED`** now.
2. ⛔⛔ **A DEVICE LOOK ON THE ALIGNMENT MODEL** — the ONLY model (`D40`), and **no hand has judged
   any of it**. The ordered list, with what falsifies each item, is §10 of
   [`../../10_INPUT_TOUCH/spec/ALIGNMENT_RULES.md`](../../10_INPUT_TOUCH/spec/ALIGNMENT_RULES.md).
   ⭐ One of its questions is **answered**: *parallel* was not the sense a hand expected, and `D78`
   made it anti-parallel. ⚠ Still open: **can an ordinary reposition shake an alignment away?**
3. ⭐ **The verdict between the two undos** — the shake and `D39`'s re-tap do the same thing,
   and the owner expects to drop one: *"this is a complicated movement to execute by the
   user."*
4. ✅ **THE APPROACH IS RE-SPECIFIED** (`D46`) and the old second half may be retired with it —
   §6.0 of [`../../10_INPUT_TOUCH/spec/APPROACH_AND_MATE.md`](../../10_INPUT_TOUCH/spec/APPROACH_AND_MATE.md) asks. ⛔⛔ **STAGE 2 — the OLD reading — was the second half of the
   owner's earlier rules** — `TargetPosition`, its
   cross-quad gizmo, the orbit about it and the two-object approach (`§2`). **Four owner
   decisions gate it** (`§7`), and one is a real design problem rather than a preference: the
   approach mapping has **no direction** when the centre→target line faces the camera and
   **shrinks to noise at contact**, with roll and depth displaced in that state so nothing can
   take over. ⭐ Nothing else in `IN3` is unbuilt.
5. ⚠ **THE MATE IS STILL UNREACHABLE — but the ORIENTATION is now a mate's** (`D78`,
   2026-09-23): the two faces point **at** each other. ⛔ Nothing is SEATED, and §4's `6quater`,
   the only rule that pushes a `MATE`, is flick-based, which this model does not have. ⭐ So what
   is left between here and `3D2` is a **position and a gesture**, no longer the geometry.


✅✅ **`A15` CLOSED BY THE SAME LOOK** — a holder no longer *under* its object gives the
selection up (a raycast at the second touchpoint's lift; the unselect deferred to the next
input event). ⚠ **The close is only as strong as the phrase that gave it**: *"everything is
working ok"* was general, and the three cases this row listed were not reported on
individually → [`../queue_notes/IN8.md`](../queue_notes/IN8.md).


## The 2026-09-16 input-model table

| what a finger does | what happens |
|---|---|
| one touchpoint drags an object | **translates** it, or **rotates** it — whichever the mode says |
| **any single tap, anywhere** | flips the mode, immediately. ⚠ A double tap flips twice **and** flies the camera home |
| a second touchpoint **pressed** | **roll** by its x *or* **depth** by its y — the mode picks one, never both. ✅ **SIMULTANEOUS with the holder's own drag** since `D43`: each finger owns a channel and they sum |
| a second touchpoint released, holder off its object | the selection drops at the next input event (`A15`) |

