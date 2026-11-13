# THE FRAME RATE ACROSS DEVICES — no clamp, the game by time (2026-11-13)

> **STATUS** · 📐 the policy — nothing built for it · ⭐ the owner's question answered, kept
> **OWNS** · whether the frame rate may differ between devices, what is frame-rate dependent, the levers if the phone needs more frames
> **READ IF** · a device's fps worries you, a move feels different on the phone, or you write a per-frame rule
> **LAST VERIFIED** · 2026-11-13 (`1.0.133-`)

## 1. The question

> *"The fps on iphone is between 48 fps and 59 fps while on my gpu computer it is above 99 fps all the time: is it a problem ? Shall I clamp the fps so
> that the user experience is the same on all devices ?"* — the owner

## 2. The answer: not a problem; no clamp

* **iPhone Safari draws at most 60 fps** (a 120 Hz screen too, unless the user turns off a hidden Safari setting); 48 – 59 is the 60 Hz ceiling with a
  dropped frame now and then. The computer's 99+ is its faster screen and its spare GPU. ⚠ What would matter on the phone: under ~30 fps (Low Power Mode
  caps the iPhone at 30 — a launch message, `10_INPUT_TOUCH/spec/BROWSER_GUARDS.md` §3), or a stutter in one particular move.
* **⛔ No clamp.** Capping the computer at 60 makes the computer worse and the phone no better. The experience is the same everywhere when the game moves
  by TIME and by FINGER TRAVEL, never by frame count — then a faster device only draws more in-between pictures.
* **This code is mostly so already:**
  * every ease, lag and catch-up `1 − exp(−dt/τ)` on the frame's own `dt` (the gizmo's ease, the orbit's spring, the box's smoothing, the camera's
    catch-up — `input/follow_camera.ts`, `input/orbit_calm.ts`);
  * the coasts in milliseconds (the orbit's inertia, the approach's);
  * the orbit, the approach (the pinch, A + drag) and the map's catch-up (`syncAngle`: by the orbit's own step) by MILLIMETRES of finger;
  * the rest window derived from the device's own pointer intervals (`D86`).

## 3. The one real frame-rate dependency

**The contact solver's budget: 24 gap queries a FRAME** (`pieceSolverQueries`, the owner's iPhone budget; one ledger a frame, `ORBIT_ANY_SHAPE.md` F5):
at 50 fps ~1 200 queries a second, at 100 fps ~2 400 — near contact a piece that needs several frames to settle settles a little slower on the phone.
⭐ Chosen on purpose for the iPhone. ⚠ The first place to look if contact feels sluggish ON THE PHONE ONLY. A new rule must not count frames: by `dt`, or
by millimetres of finger.

## 4. If the phone ever needs more frames (not built — in this order)

1. **The render resolution**: the engine renders at the screen's full pixel density (`new Engine(…, adaptToDeviceRatio = true)` — 3× on an iPhone).
   At 2× the difference is nearly invisible on that screen and the pixel work drops ~45 % (`engine.setHardwareScalingLevel`, capped to `dpr / 2`) — the
   biggest gain, one line.
2. **The shadows**: AUTO already turns them off when the median frame misses 33 ms (`D138`, `40_RENDER_SCENE/INDEX.md`).
3. **Low Power Mode off** — the player's (`BROWSER_GUARDS.md` §3).

## 5. How to judge it

The HUD's `frame` line: the median and p95 of the last 120 frames (`core/frame_meter.ts`). On the iPhone, a p95 under ~25 ms while orbiting and
approaching: nothing to do. A stutter in one move: name the move — the per-frame work there (the solver's queries, the face map's casts) is the suspect.
