# 2026-11-02 — the parts' translation, rotation and alignment DELETED

> **STATUS** · history · **OWNS** · the record of what was removed on `1.0.89-`, and where to find it again
> **READ IF** · you want back any of the parts' inputs (drag, turn, align, snap, unsnap, undo) or code from them

⭐⭐⭐ **THE CODE BEFORE THE REMOVAL IS COMMIT `d8134eb`** (branch `1.0.88-X-Y-instead-of-polar-orbit-on-horizontal-face`). Anything
listed below is there whole: `git show d8134eb:src/input/alignment.ts`, `git show d8134eb:Claude/10_INPUT_TOUCH/spec/INPUTS_TABLE.md`, or
`git checkout d8134eb -- <path>` to bring one file back.

## The request

> *"remove the translation and the rotation of the parts (the parts which are not the green or turquoise parts). Remove entirely the
> parts of scripts related to these (including their sliders) as I will not pursue these functionalities in the game (i will only keep
> orbit and sliding). Keep the parts of the scripts which are used by other methods (for example the seating of the piece, the goal
> reaching, etc.)"* — the owner, 2026-11-02

The decisions, asked and answered the same day:

1. **The loose pieces stay as they are.** ⏳ They will be given the green or turquoise objects' properties later (they will orbit and
   slide too).
2. **The workbench (`Scene_0`) stays as it is.** ⏳ It is to be updated later with the orbit and the slide instead.
3. **The undo is deleted** (the double tap on a body, `D111`/`D141`).
4. **The desktop's part keys go**: Space, the right button's HitFace, the Shift tap, Esc for a part. A + drag (the approach), ALT / CTRL
   (the held second touch) and the wheel stay.
5. **The commit is recorded** (this file) so the removed scripts can be reached again.
6. Checked first: the slide does NOT latch on the part alignment — it reads only the orbited piece's own resting face.

## What a press does now

Every press is the orbit's (`router.press(id, s, null)`; the router's OBJECT role is never asked for): on a part as on empty space.
A tap on a PLACED part still moves the gizmo there; a tap on a loose part taps the cube's face shown, as on empty space. A drag starting
on any part orbits, or slides once the slide is on. Parts move only by the orbited piece's sway (the orbit's and the slide's) and by the
goal capture.

## Deleted

* `src/render`: `drive.ts` (the parts' drag, depth, lift, spin, roll), `gizmo.ts` (their axes and rings), `alignment_wiring.ts`,
  `seat_wiring.ts`, `markers.ts` (face fills, outlines, the PioneerFaceCursor), `hold_pinch_wiring.ts`, `empty_space_probe.ts` (the edge
  band's probe), `goal_dissolve_wiring.ts`, `undo_wiring.ts` (→ `gesture_wiring.ts`, below).
* `src/input`: `alignment`, `align_snap`, `aligned_axes`, `anchor_rotate`, `assembly`, `axis_translate`, `camera_reset`, `depth_translate`,
  `edge_band`, `frozen_pick`, `goal_dissolve`, `grip_mode`, `highlight` (→ `goal_capture.ts`), `hold_pinch`, `mode_toggle` (→
  `recognizer.ts`), `object_axes`, `pioneer_cascade`, `pioneer_cursor_grab`, `pioneer_press`, `rotation_increment`, `screen_rotate` (→
  `gravity_frame.ts`), `seat_lock`, `second_touch_drive`, `snap` (→ `goal_capture.ts`), `unsnap`.
* `src/core`: `alignment_links`, `face_surface`, `pioneer_face_cursors`, `proximity`, `seat`, `undo_history` (→ `gesture.ts`).
* In the files that stay: the render loop's grip ticking, rotation follower, alignment snaps, Pioneer cascades, seats, dissolve,
  markers, edge-on check, edge band and camera reset; the HUD's axes / hit / topo / unsnap / outlines / links / undo / band fields; the
  scene state's 40-odd part fields and their types (`Held`, `BodyOutlines`, `AxisGizmo`, `FaceMarker`, `TurnAxes`) and colours; the mouse's
  Shift-made second touch, right-button HitFace and latch, Space and the Shift tap (`mouse_second_touch.ts` is the left button, ALT / CTRL
  and the swallowed right button now); the sway's spin watcher and per-part kicks.
* **The sliders** (19): the edge band, the camera reset time, the screen-plane / depth / roll / twist / free-rotation gains, the pitch
  wheel cone, the rotation increment, the part rotation's sway, the axis tracking cone, the HitFace contour, the FollowerFace x-ray, Free
  Flow and the PioneerFaceCursor's sensitivity, the unsnap window and leg — and their config keys (23 with `referenceCameraDistance`,
  `gainTranslateAxis`, `gainTranslateMutual`, `axisMappingMode`) and validator rules.

## Kept — what other methods use

* **The goal capture** (`D183`): its radius `captureOffsetM`, the flight check `snapPathBlockedBy` (both now in `input/goal_capture.ts`),
  the magnet `magnetEase` (`seat_snap.ts`), and the sliders `captureOffsetMm`, `snapMs`, `snapConeDeg` (FACE ALIGNMENT › GOAL CAPTURE).
* **The score's gesture snapshot**: `GestureSpan` and `worldsDiffer` (`core/gesture.ts`), `beginGesture` / `gestureChangedSoFar` /
  `endGesture` (`render/gesture_wiring.ts`) — a gesture that changes nothing still costs nothing (`D158`).
* **The follower and the sway** the orbit and the slide drive: `translateInertiaMs` / `DampingRatio` / `LeadMs`, `translateSway*`,
  `rotateSwayTauMs`, `swingBlock`, `nudgeOthersWorld`.
* **The object model's seat and constraints** (`attach`, `detach`, the constraint stack, `solve`): unwired, declared in
  `tests/unwired_debt.test.ts` for the pieces that will get the orbited pieces' properties (`3D2`).
* `isTapRelease` (→ `recognizer.ts`), `ScreenFrame` (→ `gravity_frame.ts`), `CameraPose` (→ `orbit.ts`), `GIZMO_RING_PX` (→
  `scene_state.ts`); the `Recognizer` class (unwired; `TapHistory`'s vectors run through it); `grabbed` (empty now: a part is judged by
  the never-grabbed goal margins until it can be moved again — ⛔ deleted the same day with `lockPlacedPieces`, the third audit's C2 / C3:
  `00_CORE/queue_notes/AUDIT_2026-11-02.md`).

## The vectors

**2171 → 1607.** Deleted whole: 29 suites that tested only removed code (`a7_wiring`, `alignment*`, `anchor_rotate`, `axis_translate`,
`camera_reset`, `d140`–`d142`, `d185`, `depth_translate`, `edge_band`, `face_surface`, `frozen_pick`, `grip_mode`, `hold_pinch`,
`object_axes`, `pioneer_*`, `rotation_increment`, `screen_rotate`, `seat_lock`, `second_touch_drive`, `squaring_twist`,
`undo_history`, …); trimmed: `snap`, `sway`, `d121_d124`, `d182`, `config_override`, `mouse_second_touch` (rewritten), `face_pick`,
`highlight_lift`; renamed: `highlight` → `capture_offset`, `mode_toggle` → `tap_release`, `undo_history` → `gesture`. The source-reading
vectors of the orbit, the hold, the slide and the goal were restated against the new wiring.

⛔ Checked headless (`cdp`): the orbit (dx, dy), the approach (A + drag) to a slide latched on a part's face, a drag begun on a loose part
(it orbits; no part moved), a tap on it (the cube's face). ⛔ **Rule 5: a device look is owed.**
