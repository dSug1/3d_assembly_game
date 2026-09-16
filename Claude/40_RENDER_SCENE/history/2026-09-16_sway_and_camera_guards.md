# The sway and the camera guards — the full text

> **STATUS** · archive of BUILT behaviour · **OWNS** · the sympathetic sway, the camera guards
> **READ IF** · you are touching the sway, the orbit rings or the camera reset
> **LAST VERIFIED** · 2026-09-16

⭐⭐ **WHY IT IS HERE, AND IT IS THE SAME REASON TWICE.** This text was in `QUEUE.md` — a
build list — describing behaviour already built; it moved to `40_RENDER_SCENE/INDEX.md`, and
when that front door reached its byte budget it moved again, to `history/`. ⛔ Nothing was
rewritten either time. ⚠ The lesson is the tier, not the file: **a front door states WHAT IS
TRUE and points at where it is explained.**

---

## ⭐ MOVED HERE 2026-09-16 FROM `QUEUE.md` — the sway and the camera guards

⚠ Both describe **built scene behaviour**, which is this folder's to own; the queue is what
gets built NEXT, and it was over its 400-line cap. ⛔ Moved whole, not rewritten.
⭐ `QUEUE.md` keeps a one-line pointer here.

### ⭐⭐ THE SYMPATHETIC SWAY — built 2026-09-14, and NOT in the spec

The scene reacts to what the held object does instead of standing frozen around it. ⛔ It
is **decoration, and it is kept out of everything that MEANS something**: the barycentre
reads home positions with the sway subtracted, so the orbit centre cannot depend on
whether the objects happened to be mid-wobble when a finger landed.

* **Translation** — the other objects drift the SAME way and spring home
  (`translateSwayMm` 0.8 mm, 180 ms, re-trigger 50°, reference 120 mm/s).
* **Rotation** — they swing as a rigid BLOCK about the held object's centre, on the axis
  it is turning about: each orbits the pivot AND spins by the same angle
  (`rotateSwayDeg` 0.3°, 180 ms, re-trigger 60°, reference 90°/s).
* **Both scale with how fast the object set off**, ×0.3…×4.5 — one proportionality gives
  both halves of *"slow translation, slow spring; rapid translation, rapid spring"*,
  because a bigger excursion still peaks at the same τ and so covers that ground faster.

⛔ **Both re-trigger on a CHANGE OF DIRECTION, and that is the part that was missing.**
The first build fired only when the finger started moving — but `motionState` does not
fall back to `STATIONARY` until 150 ms below 6 mm/s, so a hand reversing at speed never
goes still and the scene sat frozen through an entire shake. ⚠ Found by finger.

⭐ **Both direction tests are measured over a stated window, and both floors came from
the MEASURED pointer noise.** A per-sample direction is noise: at 8 ms between samples,
0.761 mm of jitter IS ±95 mm/s, and a still finger fired **272 false kicks in 3 s**.
Translation now reads displacement over 60 ms and needs 3× the noise to claim a heading;
rotation reads the NET rotation over 100 ms and needs 3× the noise seen through
`gainRotateFree` (≈ 3.05° per sample), which is 0 false kicks and a floor of 92°/s.

### ⭐ CAMERA GUARDS, built 2026-09-14

* **The orbit centre is DEFERRED by `orbitCentreGraceMs`** (120 ms). Two fingers outside
  is a PINCH, not an orbit, and they never land in the same instant — committing on the
  first one moved the marker and retargeted the camera for a gesture meant as a zoom.
* **And it is suppressed entirely while an object is held**: a touchpoint outside while a
  finger is on a part is rule 6's ANCHOR, and that gesture will never orbit.
* **Double-tap FLIES the camera home** — anywhere on the glass, eased over
  `cameraResetMs` (450 ms). ⭐ Home is the **last yellow target**, not the origin: only the
  angles and the zoom go back to their launch values, because the centre is the thing the
  user has been orbiting. ⭐ It eases the ORBIT PARAMETERS, not the camera transform, so
  the camera stays on the orbit surface the whole way — yaw takes the short way round and
  zoom interpolates geometrically, neither of which is a lerp.
  ✅✅ **The collision with §2 rule 2septies is RESOLVED** (`D12`→`D15`, 2026-09-15): eviction
  moved to a **quick back-and-forth**, so a double-tap now means one thing only. ⭐ The reset
  never moved — eviction did, twice: off the double-tap, then off the roll channel once
  `D14` gave that channel back to a real control.

