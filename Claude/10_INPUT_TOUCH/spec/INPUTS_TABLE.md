# INPUTS TABLE — every input the build answers, and what it does

> **STATUS** · live · **OWNS** · the one list of inputs, tablet and desktop
> **READ IF** · you are about to add, change or remove a gesture — or to judge one on a device
> **LAST VERIFIED** · 2026-11-13 (`1.0.128-Removed-the-zoom`: the zoom removed, the pinch is the approach — [`ZOOM_REMOVED_PINCH_APPROACH.md`](ZOOM_REMOVED_PINCH_APPROACH.md)); before: 2026-11-04 (`1.0.96-`: Step 4c-bis — the gizmo from the FACE MAP at the orbit's angles, slowly through an edge, CAMERA ORBIT AROUND CENTER › gizmo through an edge (mm, °); `1.0.95-`: Step 4c — the gizmo on the side's axis, never held on a side, the parts read at rest (the lag's gizmo ease 45 ms); the piece's lag behind the ring on two sliders, CAMERA ORBIT AROUND CENTER › lag: the gizmo's position / the orbit's angles; dx moves the gizmo round a side in step with the orbit — its place from the yaw (Step 4b); the calm of 58d86ff back — the view near square in a face's middle, CAMERA ORBIT AROUND CENTER › FACE-SPAN ORBIT SHARE; `1.0.94-`: the dy up / down a side in a world plane (Step 4); `1.0.93from1.0.87-`: the dy reaches the top / bottom centre at ±90° (Step 3); the orbit's piece and camera on the shell (Step 2); the slide on placed parts only, the close-in lock deleted; around the assembly the dy WITH the finger — finger down, the gizmo down; `1.0.89-`: the parts' translation, rotation and alignment deleted)

⭐ The rules and their reasons live in [`ALIGNMENT_RULES.md`](ALIGNMENT_RULES.md) (§12 for this
pass) and [`SPEC_INPUT_SYSTEM_R5.md`](SPEC_INPUT_SYSTEM_R5.md); this page is the inventory.
⛔ **No row here is judged by a hand yet** since the 2026-09-27 simplification — rule 5 is owed.

⛔⛔⛔ **2026-11-02 (`1.0.89-`, the owner: *"remove the translation and the rotation of the parts … I will only keep orbit and sliding"*)** —
a PART (every piece but the orbited green / turquoise one) is no longer held, translated, rotated, aligned, snapped or unsnapped by any
input, and the undo, the edge band, the mode toggle, the HitFace and the PioneerFaceCursor went with them. ⭐ Every row for them is
REMOVED from this table; the table as it stood is at commit **`d8134eb`** (`git show d8134eb:Claude/10_INPUT_TOUCH/spec/INPUTS_TABLE.md`),
and so is the code (`git show d8134eb:src/...`). ⏳ Later: the parts will be given the orbited pieces' properties (they orbit and slide too).

⛔⛔⛔ **2026-11-13 (`1.0.128-Removed-the-zoom`, the owner: *"remove the zoom function entirely"* → *"build A"*)** — NO ZOOM on either device (the
pinch, the wheel, the boot zoom); around the assembly **the PINCH is the APPROACH** (spread: in; pinch: out) → [`ZOOM_REMOVED_PINCH_APPROACH.md`](ZOOM_REMOVED_PINCH_APPROACH.md).

⭐⭐⭐ **2026-11-14 (`1.0.143from1.0.142-Pick-up-of-parts`) — THE PICK-UP FLOW, a scene's `.glb` parts (`Scene_2`)** →
[`../../20_GAME_RULES/spec/PICK_AND_PLACE.md`](../../20_GAME_RULES/spec/PICK_AND_PLACE.md): the rows marked *(`.glb` parts)* below; ⛔ no device look yet.

## 1. Tablet (touch)

| holding | input | does |
|---|---|---|
| nothing *(`.glb` parts)* | a TAP on a part whose step is available (outlined) — within 9 mm, the nearest | **PICK**: the part in hand, the piece orbit by the clock (600 ms, the inputs held) |
| a part *(`.glb` parts)* | right after a pick, a TAP on another candidate within reach | **CYCLE**: the first back where it lay, the other picked |
| a part *(`.glb` parts)* | a DOUBLE TAP on it (within 9 mm) | **PUT DOWN**: the free spot nearest, the least turn; the scene orbit by the clock |
| a part *(`.glb` parts)* | a single TAP on it | after the double-tap window: the face of its face proxy tapped becomes its resting face |
| a part *(`.glb` parts)* | no input for the idle orbit's time | the camera blends to the scene orbit's distance (the idle orbit there); back on an input |
| nothing | 1 finger drag on empty space | orbit the camera (three rings) |
| ⭐ the orbited piece (prototype, 2026-10-11) | a first touch / left press on a placed part | moves the **orbit centre** (the pink gizmo) |
| ⭐ the orbited piece (prototype, 2026-10-28; `orbitMode` 0) | 1 finger drag | **the orbit around the assembly**: dx the yaw, dy the pitch (±90°, 2026-10-29; ⭐ 2026-11-04 WITH the finger: down, the gizmo down — `orbitDy`) — ⭐⭐⭐ (2026-11-04, Step 4c-bis) the gizmo from the FACE MAP: the angles' place on the assembly's core box (dx round the sides at the gizmo's height, each side a slice of the turn; dy up a side in the world's vertical plane square to it, over the top / under the bottom to the centre at ±90°), the ray along the face's axis onto the slide's coplanar regions (holes closed), slowly through an edge (the last / first 10 mm in 10°) — where the green and red sections meet, both drawn (⛔ the carrier on the section's hull, 2026-10-29 … Step 4c, deleted) |
| ⭐ the orbited piece (prototype, ⭐⭐⭐ 2026-11-13; `orbitMode` 0) | **2 fingers spread apart / pinched together** (`pinchLatched`: their separation past the deadband from where they landed; ⭐ the second may land ON the piece) | **the APPROACH** — spread: in, toward the gizmo the ray finds, to the contact; pinched: out; × `approachPinchGain` (CAMERA ORBIT AROUND CENTER). ⛔ Two fingers moving together (`twoFingerKind`, 2026-10-28) no longer approach |
| nothing | 2 fingers pinch on empty space | ⛔ nothing — the zoom deleted 2026-11-13 |
| ⭐ the orbited piece (prototype, 2026-10-11) | a SECOND finger held (off the orbited piece) + the first finger's **dx** | the **way in**, the orbit round the piece and the **roll** (dy ignored); the first finger may lift and press again (the same input); the second **lifted**: the **way out** (`RESTING_FACE_ALIGNMENT.md` §20) |
| ⭐ the orbited piece (prototype, 2026-10-11) | a TAP on the orbited piece — the first finger's OR the second's | the face hit becomes the **resting face**, aligned (§13, §20) — ⭐ (2026-10-14) to the direction SHOWN: the yellow quad, or, the quads hidden, the gizmo's supporting face (yellow) (`RESTING_FACE_ALIGNMENT.md` §28) |
| ⭐ the orbited piece (prototype, 2026-10-13) | first finger held (empty space or a part) + a second finger TAP on empty space or a frozen body | ⭐⭐ the same as a first-touch tap on empty space: the YELLOW quad tapped — aligned to its direction, or the roll when already aligned there (`holdTapTapsYellow` → `orientTapShown`); one episode. (It only rolled until 2026-10-13.) |
| ⭐ the orbited piece (prototype, 2026-10-11) | first finger held ON A PART, second finger held, first drags | as from empty space — ⭐ (2026-11-02) a press on a part IS empty space |
| ⏸ the orbited piece (prototype, 2026-10-12) | (the way in + roll, the zoom ↔ roll switch) | ⏸ COMMENTED OUT 2026-10-12 (then two fingers were the standard pinch zoom — ⛔ deleted 2026-11-13; around the assembly the pinch is the approach) |
| ⭐ the orbited piece (prototype, 2026-10-12) | a first-touch TAP on a RESTING-FACE QUAD (⛔ the orientation window is deleted) | the resting face SITS AGAINST the side tapped (the other side: 180°); the same quad again — the roll; it becomes the yellow quad until the next drag; one episode each. ⛔ Over the piece, the piece's resting-face pick wins |
| ⭐ the orbited piece (prototype, 2026-10-12) | a first-touch TAP on EMPTY space (left click on desktop) | a tap on the YELLOW quad's direction (the candidate, or the quad last tapped until the next drag): aligned to it, or the roll |
| ⭐ the orbited piece (prototype, 2026-10-12) | first finger held + a second finger TAP on a PLACED part | moves the **orbit centre** (the pink gizmo) there, as a first touch's press does — never a roll; ⛔ no pink face from a part, no alignment (the cube's only). ⭐ (2026-10-13) a tap whose wobble already started the pinch is still a tap (`holdTapMode`; the zoom undone) |
| ⭐ the orbited piece (prototype, 2026-10-13) | a first-touch (or left) press on a PLACED part, then a DRAG | ORBITS — ⛔ the gizmo no longer moves (it did at the press since 2026-10-01); released as a TAP, the gizmo moves to the press point (`orbitTargetOnRelease`, `COLLISION.md` §11nonies) |
| ⭐ the orbited piece (prototype, 2026-10-13) | any ORBIT drag (empty space, a placed part, the coast excepted) | ⭐ through its OWN per-axis DEADBAND (`orbitDeadbandMm`, 2.3 mm — ≥ 3× the pointer noise): a wobble on the axis the finger is not moving emits nothing; ⚠ one band of dead travel when an axis enters motion, and again only after a real PAUSE (`orbitBandRestMs`, 400 ms — a hesitation keeps the drag live); a resting finger's tremor does not hold it moving (~0.5 s to re-rest) (`COLLISION.md` §12ter–§12septies) |
| ⭐ the orbited piece (prototype, 2026-10-13) | a TAP on the piece while the red *Part is blocked* pop-up shows | **nothing** — consumed, so the second tap of a double tap finds the respawn still armed; a DOUBLE tap respawns (`pieceTapAction`, `COLLISION.md` §12quater) |
| ⭐⭐⭐ the orbited piece (prototype, 2026-11-01; `orbitMode` 0) | — (the approach or the orbit brings the resting face within 20 mm of an aligned part's face — ⭐ 2026-11-04 a PLACED part only (`goalLocked`): the contours light) | **THE SLIDE MODE latches by itself** — the piece settled onto the face, the camera blended to the slide view (500 ms); then EVERY 1-finger drag (left drag on desktop), on the piece, a part or empty space, slides the piece and the gizmo; lifting keeps it on; 2 fingers / A + drag are the approach — out beyond 20 mm leaves it (the camera blended back, the gizmo where the slide left it) (`HOVER.md` item 30) ⭐ a drag still moving when the contours light: the orbit holds the piece there until it latches (800 ms at most), and the same finger slides (item 31); ⛔ lifting EITHER of the approach's two fingers ends the approach — the one left slides (item 32); ⭐ the slide turns the camera round the way the piece goes, 2°/mm, up to the isometric corner (45° each way), the assembly swaying as for the orbit (item 33); ⭐ over a horizontal face by yaw and pitch (35°–85°), a drag slides from its first move, a blocked one says why on the HUD and goes along what blocks it, the gizmo hidden while lit / sliding (item 34); ⭐ taken away, the orbit goes on from the slide's view, and a slide latched edge-on still slides (item 35); A pressed again with the click held takes up the approach from where the pointer is (item 40), and a way out a part blocks is refused, named on the HUD (item 41) |
| ⭐ the orbited piece (prototype, 2026-10-14; ⭐ `orbitMode` 1 since 2026-11-01) | a drag (left drag on desktop) that STARTS ON the piece, while its resting face LOOKS AT a part's face within reach (anti-parallel ≤ 2°, ≤ `hoverApproachMm` 20 mm — the piece's contour turns GREEN #D8FDD2, a contact shadow on that face) | **HOVER** — the piece first SETTLES onto the face (to the 1 mm gap), then slides it (and the yellow gizmo, `hoverGizmoMove` 1) on that face's plane, through the orbit band's deadband, × `hoverGain`, within `hoverAmplitudeMm` (500 = unlimited), across coplanar faces; the camera eases to the face-on hover view with the travel; the other parts sway at 0.1°; lifting the finger is back to the orbit, the next orbit drag the way out (`HOVER.md`). Not in contact: the drag orbits  ⭐ (2026-10-14, second audit) the resting face must lie OVER that face; the piece still easing: the drag waits; a capture during it stops the finger until it lifts. |
| nothing | double tap on empty space | ⛔ nothing — the camera reset is deleted (2026-10-10) |
| — | ⭐ **the ⏸ button, bottom-left** (`D144`) | the **pause menu**: *Resume*, *Restart level*, *Quit to menu* (that world's level list). A DOM button — it never reaches the gesture layer and is **not** an episode |
| — | ⭐ (2026-11-02) a press, a drag or a tap on a PART (placed or not) | the same as on empty space — the orbit, the slide, the cube's tap; ⛔ a part is never held, moved, turned or aligned by a finger |

⭐ **Automatic, not an input**: the **goal capture** — a piece that moves into its goal's margins is pulled onto its exact goal pose
(`D183`; the snap's margins and magnet, kept for it). ⭐ A **frozen body the camera sees from BELOW disappears** (`D128`), its top face's
contour shown instead (`D196`).

## 2. Desktop (mouse — the left button, ALT / CTRL, the wheel)

| holding | input | does |
|---|---|---|
| *(`.glb` parts)* | a left click / a left double click | as the tap / the double tap above (pick, cycle, put down, the resting face) |
| nothing | left drag on empty space | orbit the camera |
| — | wheel | ⛔ nothing (swallowed: the page neither scrolls nor zooms) — the zoom deleted 2026-11-13 |
| ⭐ the orbited piece (prototype, 2026-10-28; `orbitMode` 0) | **A held + left drag** (a mouse or a touchpad; ⭐ 2026-10-29, ⛔ Shift — Windows' Sticky Keys) | **the APPROACH** (dy: up in, down out); dx nothing; no orbit |
| ⭐ the orbited piece (prototype, 2026-10-12) | ALT or CTRL held + a left drag | orbits the CENTRE (⏸ the way in, round the piece and its roll are commented out) |
| ⛔ the orbited piece (prototype, 2026-10-12) | ALT / CTRL pressed with the cursor over a placed part | nothing — ⛔ the key's raycast is deleted (it took the pink face, aligned to it); the key is the held second touch only |
| ⭐ the orbited piece (prototype, 2026-10-11) | a left click (a first-touch tap) on the orbited piece | the face hit becomes the **resting face**, aligned (§20); ⛔ ALT / CTRL over it does nothing since 2026-10-12 |
| ⭐ the orbited piece (prototype, 2026-10-13) | left held (empty space or a part) + an ALT / CTRL TAP | as the touch: the YELLOW quad tapped — aligned to it, or the roll when already aligned there (the key looks at nothing) |
| ⭐ the orbited piece (prototype, 2026-10-11) | left held ON A PART + ALT / CTRL held + left drag | as from empty space — ⭐ (2026-11-02) a press on a part IS empty space |
| — | Space, Shift, the right button | ⛔ nothing (2026-11-02: the parts' inputs deleted, `d8134eb`) |
| ⭐ the orbited piece (prototype, 2026-10-12) | a left CLICK on a RESTING-FACE QUAD | as the touch tap: the side clicked, the roll again, the yellow quad |
| — | ⭐ **left click on the ⏸ button** (`D144`) | the pause menu, as on the tablet |
| nothing | double left click on empty space | ⛔ nothing — the camera reset is deleted (2026-10-10) |
| — | Esc | lifts the ALT / CTRL second touch (as its key's release) |
| — | the window losing focus (Alt+Tab, …) | the ALT / CTRL second touch lifts; nothing else changes (`D167`) |
| — | Alt, F10 | nothing — the browser's menu is kept from taking the keyboard (`D167`) |

## 3. Deleted, and what replaced each

| gone | by | now |
|---|---|---|
| `FOLLOW` (double press, amber) | `D106` | every alignment is a snapshot; a **seat** carries |
| the Follower shake, the Pioneer shake | `D107` | tap empty space while holding |
| `D39`'s re-press undo | `D107` | tap empty space while holding |
| the flick's drop-alignment branch | `D107` | — (the flick is deleted, `D110`) |
| the flick itself (rotation reset) | `D110` | the undo |
| `D103`'s flick-unsnap (specified) | `D110` | the precise unsnap; the undo |
| the camera reset by a double tap on a BODY | `D111` | empty space — and the **edge band** is always empty space (`D113`) |
| ⛔ the camera reset by a double tap / double click on EMPTY space | prototype, 2026-10-10 (*"remove the camera reset"*) | none — the orbit rig places the orbited piece, so a reset threw it back to its boot spot on the rings |
| any tap toggling the mode | `D108` | tablet: one tap on empty space, free body held; desktop: a Shift tap while a free part is pressed (`D167`; Ctrl before) |
| the pinned Pioneer (`pioneerTranslates=0`) | `D109` | an aligned Follower's second finger drives both axes anywhere |
| `worldAxisB=0`, `translatePairing=0` | `D109` | boot-fixed axes, plane solve — ⛔ themselves replaced by the live camera's (`D145`) |
| the fuchsia offer | `D109` | its cone is the **snap cone angle** (CAPTURE) |
| `CameraOffsetZoneEnter` (empty) | `D109` | — |
| a Shift + left drag on empty space zooming (a pinch of two mouse-made touches) | `D118` | the wheel |
| ⛔ the ZOOM — the pinch on empty space, the two-finger pinch around the assembly, the wheel, the boot zoom and its keep-in-view floor | 2026-11-13 (`1.0.128-Removed-the-zoom`) | none — the camera the radius offset behind the piece; the approach brings the piece in |
| two fingers moving together as the approach (`twoFingerKind`) | 2026-11-13 | the PINCH is the approach (spread: in) |
| aligning on the second touch's PRESS | `D119` | aligning on its released TAP |
| `D89`: a second touch on the frozen plate selects it | `D119` | a tap on it aligns; a press steers |
| the white capture contour and shell; the camera swing at capture (`D63`) | `D120` | — (the snap never used them) |
| a second touch on another body GRABBING it (two bodies moved at once, tablet only) | `D124` | it steers the held body; a tap aligns |
| a free body's second touch in `TRANSLATE` giving only gravity | `D123` | gravity + a spin about gravity |
| ⛔⛔ every PART input: the translation, the rotation and its mode toggle, the alignment (HitFace, Pioneer tap, Space, right button), the snap and unsnap, the PioneerFaceCursor, the undo (double tap on a body), the edge band | 2026-11-02 (`1.0.89-`; the code before it: commit `d8134eb`) | none yet — only the orbited piece moves (orbit, approach, slide); the parts will get its properties later |

## 4. The HUD's first line (`D112`)

`score  N episodes  mm:ss` — the touchpoint episodes counted by `SCORE.md` §3 (a gesture that changes nothing is free, `D158`), the time
since the first press. ⛔ The `undo=K` field went with the undo (2026-11-02).

## 5. Device checklist

⛔ The 2026-09-29 checklist (`D155`–`D172`, closed by the owner 2026-09-30) was about the parts' inputs, deleted 2026-11-02; it is at commit
`d8134eb` in this file.
