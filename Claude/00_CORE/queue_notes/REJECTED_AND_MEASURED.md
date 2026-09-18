# REJECTED AND MEASURED — work that was built, measured, and taken out

> **STATUS** · closed · **OWNS** · the ideas this project tried, measured and removed
> **READ IF** · you are about to add inertia to a rotation, or to tell a follower how fast
> its target is moving — or you are wondering why the shipped `translateInertiaMs` is 7.6 ms
> **LAST VERIFIED** · 2026-09-17

⛔⛔ **DISTILLED OUT OF [`../QUEUE.md`](../QUEUE.md) ON 2026-09-17**, when the audit's state had
to fit and the front door was 63 bytes from its budget. ⭐ Nothing is rewritten: the text below
is the block as it stood, moved one tier down exactly as `Claude/README.md` requires — *hitting
the cap is the signal to push narrative down a tier, not to keep appending.*
⚠ The QUEUE keeps a two-line pointer, because the WARNING is state and the STORY is not.

---

### ⛔⛔ TWO THINGS A NEW SESSION MUST NOT REBUILD

Both were built, MEASURED, and taken out. They are recorded because the ideas are
attractive and will occur to anyone reading this code.

1. **Inertia and a phantom lead on the object's ROTATION.** Built 2026-09-14 as
   `src/input/spin.ts` — a critically/under-damped follower on the rotation vector of the
   error, with the branch cut handled and 12 vectors green. ⛔ **The owner rejected it on
   the device: *"I did not like the rotation inertia and slerp implementation."*** Rotation
   stays direct. ⚠ Do not re-derive it because translation has it: they were judged
   separately and came out differently.
2. **Telling the follower how fast the TARGET is moving** (`targetVelocity` in
   `follow.ts`). Arithmetically right — it makes a dragged object's trail frame-rate
   exact, 0.32 mm instead of 0.74 mm at 120 Hz. ⛔ **It made everything visibly jitter and
   was reverted.** Pointer events and render frames are not locked, so the per-frame target
   delta alternates (a frame with no event sees 0, the next sees double) and the lag term
   writes that beat into the position: frame-to-frame step change went from 1.12 mm to
   3.25 mm at 90 Hz pointer / 60 Hz frame, and 1.63 → 4.58 at 60/120.
   ⚠ **Mistake shape 1, committed in the file that warns about it.** Smoothing the
   estimate does not rescue it — the estimate is not the problem, the BEAT is. And the
   thing it bought was invisible: both trails are under the measured 0.761 mm pointer
   noise. ⭐ *An invisible 0.4 mm of trail is not worth a visible 2 mm of jitter.*

### ⭐ AND A NUMBER THAT CAME OUT OF THAT: the inertia has a FLOOR

The target only moves when a pointer event lands, so it arrives as a staircase of about
`speed ÷ pointer rate` — ~1.1 mm at 100 mm/s. **The mass is what smooths it**, which
means `translateInertiaMs` must be at least about one pointer interval (**8–12 ms**) or
the beat between the pointer clock and the frame clock is visible as jitter, whatever
else is tuned. Measured: 1.0–1.6 mm of wobble at τ = 1 ms against 0.43–0.69 mm at τ = 8 ms.
⚠ That is why the shipped τ is 7.6 ms and not lower.

