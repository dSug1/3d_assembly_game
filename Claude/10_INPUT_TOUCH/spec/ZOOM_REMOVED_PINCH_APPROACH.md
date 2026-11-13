# THE ZOOM REMOVED — THE PINCH IS THE APPROACH (2026-11-13)

> **STATUS** · ✅ built (`1.0.128-Removed-the-zoom`, `ce3e6c7`; live `c9738e4`) · ✅✅ closed by the owner's look (2026-11-13)
> **OWNS** · why there is no zoom; the phone's approach by the pinch — its latch, its mapping, its slider
> **READ IF** · you touch two-finger input, the camera's distance, the wheel or the approach
> **LAST VERIFIED** · 2026-11-13 (1716 vectors)

## 1. The owner's words

> *"Set the zoom at 1 and then remove the zoom function entirely. With the approach of the piece, there is no need for zoom."*
> *"Then, simplify the two finger approach on mobile phone: it is currently difficult to latch the two finger approach: propose something simpler
> (for example, use the pinch input for the approach on mobile phone)."* → (A proposed, B the alternative) → *"build A"*.

## 2. The zoom removed

**What it was**: one scalar (`st.zoom`) — since 2026-10-02 the camera's distance BEHIND the orbited piece (`cameraRadiusOffsetMm × zoom`, held to
0.1 – 2, never closer than kept the piece on screen: `minGreenZoom`); written by the wheel (`D118`), the pinch on empty space (§2 rule 4, `IN9`),
the two-finger pinch around the assembly (`twoFingerKind`'s `ZOOM`) and the boot-zoom slider (`bootZoom`, 1 since 2026-10-02).

**Deleted** (no stand-in): the four inputs; the state (`zoom`, `zoomAtPinchStart`, `orbitStartZoom`, the pinch tracker `st.pinch`, the floor's cache
`greenZoomMin`); the range and the floor (`clampGreenZoom`, `minGreenZoom`, `GREEN_ZOOM_MIN` / `_MAX`); the tunables `bootZoom`, `pinchDeadband`,
`gainZoom`, `greenKeepInViewMargin` and their sliders (CAMERA OFFSET); the modules `input/pinch.ts` and `input/mouse_wheel_zoom.ts`
(`clampCameraRadiusM`, the near-plane guard, kept in `input/camera_radius.ts`); the HUD's `zoom=` and `ZOOMING`; the hold mode `ZOOM`.

**What stays**:
* the camera sits the radius offset (1.25 m) behind the piece — zoom 1, where it booted since 2026-10-02: nothing on screen moves at boot;
* the **wheel is swallowed** (`preventDefault` only) — the page neither scrolls nor zooms (Ctrl + wheel is the browser's zoom, and Ctrl is the orbit's
  held second touch);
* the **demo's camera** (`D171`: the fit at its start to the rig's maximum at its end) is not a player zoom: its own scale, `st.demoCameraScale`
  (1 elsewhere) — checked headless against the old code: the same camera, frame for frame (the old floor never reached it, 0.43 under 0.50 – 0.57);
* the geometry's ring scale argument (`orbitOffset(…, zoom)`, `GREEN_PIECE_ORBIT_ZOOM` = 1) — always 1, its signatures untouched;
* ⏸ the parked way in (`holdDecision`, `holdSwitch`, commented out since 2026-10-12, *"don't remove it"*): its `ZOOM` names the deleted pinch, typed
  apart (`ParkedHoldMode`).

## 3. The pinch is the approach (the phone)

**Why the old one was hard to latch**: `twoFingerKind` judged the FIRST move once — the fingers' common motion the approach, their relative motion the
pinch zoom — and the larger won. A real two-finger swipe wobbles; the wobble often fell on the pinch side, which then held for the whole gesture.

**The rule** (`input/assembly_orbit.ts`; wired in `render/hold_wiring.ts`):
* around the assembly, two real fingers (the first anywhere, the second off the orbited piece's tap) LATCH the approach as soon as their
  **separation** has moved past the motion deadband (3.5 mm) from where they landed (`pinchLatched`) — whatever else they do; nothing to classify;
* from the latch, each move sends the separation's change since the last read (`pinchApproachDyMm`): **spread = IN** (toward the gizmo, to the
  contact), **pinched = OUT**, × `approachPinchGain` — re-anchored at the latch, so no jump by the deadband; the separation (tens of mm) sits far above
  a finger's jitter;
* unchanged: either finger lifting ends it and its coast starts; a second finger's TAP that wobbled into it is still a tap, the approach undone
  (`holdTapMode`); the desktop: A + drag (the Alt / Ctrl key has no position — never a pinch);
* ⛔ two fingers moving TOGETHER no longer approach (the two fingers' mean dy, 2026-10-28) — a swipe moves nothing; away from the assembly two fingers
  move nothing (they zoomed).

**Slider**: ☰ → CAMERA → CAMERA ORBIT AROUND CENTER → *approach by pinch: per mm of the fingers' spread* (`approachPinchGain`, 0.1 – 5, default 1 — a
mm of spread a mm of the old two-finger dy; ⚠ a guess, for the device).

## 4. Vectors

`tests/zoom_removed.test.ts` (6) and `tests/pinch_approach.test.ts` (5 — the latch, the sign and gain, a replayed spread latching within 3 frames
with no jump, a swipe moving nothing, the wiring) — all eleven RED against `601cc85`. Deleted with the zoom: `pinch.test.ts`, `mouse_wheel_zoom.test.ts`,
the green piece's zoom range and floor (`proto_green_box.test.ts`); about ten source pins updated. **1716**.

## 5. Open

* ✅✅ the device look — the owner, 2026-11-13: *"pinch approach tested ok on device"* (the gain kept at ×1);
* the desktop has no zoom either (the wheel did it): A + drag is its approach.
