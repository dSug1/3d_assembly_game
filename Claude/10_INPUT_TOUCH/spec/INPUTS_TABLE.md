# INPUTS TABLE — every input the build answers, and what it does

> **STATUS** · live · **OWNS** · the one list of inputs, tablet and desktop
> **READ IF** · you are about to add, change or remove a gesture — or to judge one on a device
> **LAST VERIFIED** · 2026-09-27 (`1.0.41-Mondrian`, `D106`–`D124`)

⭐ The rules and their reasons live in [`ALIGNMENT_RULES.md`](ALIGNMENT_RULES.md) (§12 for this
pass) and [`SPEC_INPUT_SYSTEM_R5.md`](SPEC_INPUT_SYSTEM_R5.md); this page is the inventory.
⛔ **No row here is judged by a hand yet** since the 2026-09-27 simplification — rule 5 is owed.

## 1. Tablet (touch)

| holding | input | does |
|---|---|---|
| nothing | 1 finger drag on empty space | orbit the camera (three rings) |
| nothing | 2 fingers pinch on empty space | zoom |
| nothing | double tap on empty space | reset the camera |
| — | ⭐ **anything in the EDGE BAND** — ⚠ it exists only when **no empty space is left on the screen** (`D114`); then 6 mm along the edges, dashed line, width = the slider at the top of **CAMERA** (0 = never) | empty space, whatever is drawn there — so a double tap there always resets the camera, one finger orbits, two pinch (`D113`). The HUD's first line shows `band=off` or `band=6mm` |
| — | ⭐ **double tap on the body the last action MOVED** (double click on desktop) | **undo that action** — move, turn, alignment, snap, unsnap, release; again to go further back (`D111`). ⭐ On any OTHER body it is refused and the HUD says which body moved (`D141`) ⭐ A double tap that does not land costs zero episodes (`D157`) |
| nothing | single tap anywhere | ⛔ nothing (`D108`: no longer toggles) |
| — | ⭐ **the ⏸ button, bottom-left** (`D144`) | the **pause menu**: *Resume*, *Restart level*, *Quit to menu* (that world's level list). A DOM button — it never reaches the gesture layer and is **not** an episode |
| a FREE body | 1st finger drag, `TRANSLATE` | slide it in the horizontal plane along THIS camera (`D145`): `dx` along the screen's right; `dy` along the view — finger up AWAY if the camera is at/above the gizmo, TOWARD if below (read every step, `D148`). Red + blue light together; each stops at the object it hits, with a white ring (`D153`) |
| any body, being TRANSLATED | ⭐ **both fingers move sideways in OPPOSITE directions, with no `dy`** — a horizontal pinch, the 2nd finger anywhere (empty space, the body, another body) | **zoom** (spreading = zoom in, closing = zoom out, as the empty-space pinch); the **translation and the roll are PAUSED**. ⭐ It **ends as soon as either finger's `dy` is not zero** — that move translates again; both ways read the same deadband (`motionDeadbandMm`, OBJECT TRANSLATION) (`D137`, amended) |
| a FREE body | 1st finger drag, `ROTATE` | yaw about the vertical + pitch about the boot camera's right |
| a FREE body | 2nd finger `dy` / `dx` (empty space, the body, or ANOTHER body), `TRANSLATE` | lift along gravity / ⭐ **spin about gravity**, together — the aligned body's pair, with gravity for the normal (`D123`) |
| a FREE body | 2nd finger `dx` (empty space, the body, or another body), `ROTATE` | roll about the depth axis |
| a FREE body, no followers | ⭐ 2nd finger **tap on empty space** | **toggle `TRANSLATE` ↔ `ROTATE`** — the only toggle (`D108`) |
| any body (its face = the HitFace) | 2nd finger **TAP a face on another body** — press and release, short and still | align: the held face turns to point AT the tapped one (anti-parallel); replaces any earlier alignment. ⛔ `D119`: a 2nd finger that PRESSES and stays, or moves, aligns nothing |
| any body | 2nd finger **TAP the frozen plate** | align to the plate's face under the finger (`D119`) |
| any body | 2nd finger **press / drag on ANOTHER body** — frozen plate or not | ⭐ it STEERS the held body (`dy` lifts, `dx` spins or rolls) and never grabs the other one: two bodies are no longer moved at once (`D124`, `D119`). ⛔ Except a body SEATED in the held body's assembly — the unsnap's touch |
| an ALIGNED body | 1st finger drag, any mode | slide it as a free body does (`D145`; `D108`: mode-less) |
| an ALIGNED body | 2nd finger `dy` / `dx`, anywhere (another body included) | lift along gravity / spin about the aligned normal, together |
| an ALIGNED body | 2nd finger tap on empty space | **unalign** it (`D95`) |
| a PIONEER (has followers) | 2nd finger tap on empty space | **release all its followers** (`D107`) |
| a SEATED member | 1st finger drag | the whole assembly translates (`D102`); its rotation stays its own twist |
| the Pioneer, then press the Follower | rapid zoom-out (fingers spread) | **unsnap** (`D100`; window / leg sliders in CAPTURE) |
| — | press within the ring's grab radius | drag the PioneerFaceCursor along its face — ⚠ only in **Free Flow** (ships OFF) |

⭐ **Automatic, not an input**: the **snap** — an aligned Follower whose FollowerFace centre comes
within the capture offset of its PioneerFaceCursor, normals within the **snap cone angle**, lerps
onto it and is seated (`D100`). ⭐⭐ **And the drag that made the seat STOPS** (`D139`): a finger holding the
Follower drives nothing more — no translation, lift, pinch-zoom or tap — **except the roll** (the second
finger's `dx`), until it lifts or the click is released; ⭐ and (`D172`) the roll only from a second touch or Shift
pressed AFTER the snap — the one already down at the snap is disarmed. ⭐⭐ **And a seated piece that is in its GOAL pose lets go of its
Pioneer** (`D142`): the couple, its highlights and its cursor disappear, the piece stays where it is, and a pop-up
says *reached its goal*.
⚠ A frozen body (the plate): EVERY press on it is a miss (`D119`) — a first touch drives the camera,
a second touch drives the held body's gravity / roll; only a TAP on it names it as a Pioneer. ⭐ The
one exception: a plate with a part SEATED on it is holdable by the first touch — the unsnap's.
⭐ **Automatic, not an input**: a **frozen body the camera sees from BELOW disappears** — the camera is
past the plane of its bottom face; it is neither drawn nor picked, so a press reaches what is behind it
(`D128`, which reverses `D121`'s see-through; no slider).
⭐ **Edge-on** (camera within 5° of level, HUD `⛔EDGE-ON`): the holder's `dy` drives **blue alone**,
finger up = **away from the camera**, read along camera → gizmo (from below: toward), and `dx` drives red (`D127`, `D132`).
⛔ **No white highlights any more** (`D120`): the white capture contour and shell, and the camera swing
on entering the capture zone, are deleted.

## 2. Desktop (mouse — a two-touch device, `D94`)

| holding | input | does |
|---|---|---|
| nothing | left drag on empty space | orbit the camera |
| — | wheel | zoom |
| — | ⭐ **left click on the ⏸ button** (`D144`) | the pause menu, as on the tablet |
| nothing | double left click on empty space | reset the camera |
| — | ⭐ **double left click on any body** | **undo the last action** (`D111`); one that does not land costs zero episodes (`D157`) |
| a FREE body | left drag | translate as the tablet's first finger (`D145`; `D108`: no mode on desktop) |
| a FREE body, pressed | ⭐ **a Shift TAP** (`D167`) | toggle translation ↔ rotation (it persists); ⛔ Ctrl does nothing since `D167` |
| a FREE body, in `ROTATE` | left drag | rotate: yaw + pitch |
| a FREE body | Shift + left drag | gravity (`dy`) + ⭐ **spin about gravity** (`dx`) (`D123`) |
| a FREE body, in `ROTATE` | Shift + left drag (a HOLD) | roll (`dx`) |
| an ALIGNED body | left drag | slide in its horizontal plane (mode-less) |
| an ALIGNED body | Shift + left drag | gravity (`dy`) + spin about the normal (`dx`) |
| — | **right-press** on a face | that face is the HitFace; the right button never moves anything. ⭐ `D161`: released with nothing done, it stays LATCHED (as Space + click) — the next plain click completes the action |
| right-hold | left click on another body's face | align — ⭐ on the click's RELEASE, like a tap (`D119`) |
| — | ⭐ **Space + click** (left or right) on a face | `D154`: that face is the HitFace, LATCHED past the click; an ongoing drag freezes |
| a Space-latched HitFace | ⭐ **a click** (left or right — Space NOT needed, `D159`) on another body's face | align — one episode; on the SAME part: cancel the HitFace (`D160`, the count is the underlying action's); Esc: cancel |
| a Space-latched HitFace | ⭐ **a click on empty space** (Space not needed, `D159`) | `D156`: **unalign** it (a Pioneer: release its followers) — one episode |
| left button on a body (dragging or not) | ⭐ **press Space** | `D155`: the drag stops and its pressed face becomes the latched HitFace; ⭐ `D159`: nothing is counted yet — the action that follows lands ONE episode (Esc after a move: 1; after a press held still: 0) |
| — | after an alignment made with Space | `D155`: Space must be released or hit again before it selects another HitFace |
| right-hold | left drag on another body | ⭐ steers the right-held body, like a drag on empty space — never moves the other (`D124`) |
| right-hold on an aligned body | left click on empty space | unalign it |
| right-hold on a Pioneer | left click on empty space | release all its followers |
| the Pioneer, then the Follower | rapid move | unsnap |
| — | left press inside the ring | drag the PioneerFaceCursor — ⚠ Free Flow only |
| — | Esc | lift the Shift-made second touch, cancel a latched HitFace or a pending tap (`D167`: no longer sends a held part away) |
| — | the window losing focus (Alt+Tab, …) | ⭐ `D167`: nothing — only Shift and Space are forgotten as held |
| — | Alt, F10 | ⭐ `D167`: nothing — the browser's menu is kept from taking the keyboard |
| nothing | Shift + left drag on empty space | ⛔ nothing — it no longer zooms (`D118`); the **wheel** is the desktop's zoom |

⛔ Shift (held) is a **modifier of a movement already engaged**; a Shift TAP toggles the mode (`D167`) — neither is a touchpoint episode
of its own ([`../../20_GAME_RULES/spec/SCORE.md`](../../20_GAME_RULES/spec/SCORE.md) §3).

## 3. Deleted 2026-09-27, and what replaced each

| gone | by | now |
|---|---|---|
| `FOLLOW` (double press, amber) | `D106` | every alignment is a snapshot; a **seat** carries |
| the Follower shake, the Pioneer shake | `D107` | tap empty space while holding |
| `D39`'s re-press undo | `D107` | tap empty space while holding |
| the flick's drop-alignment branch | `D107` | — (the flick is deleted, `D110`) |
| the flick itself (rotation reset) | `D110` | the undo |
| `D103`'s flick-unsnap (specified) | `D110` | the precise unsnap; the undo |
| the camera reset by a double tap on a BODY | `D111` | empty space — and the **edge band** is always empty space (`D113`) |
| any tap toggling the mode | `D108` | tablet: one tap on empty space, free body held; desktop: a Shift tap while a free part is pressed (`D167`; Ctrl before) |
| the pinned Pioneer (`pioneerTranslates=0`) | `D109` | an aligned Follower's second finger drives both axes anywhere |
| `worldAxisB=0`, `translatePairing=0` | `D109` | boot-fixed axes, plane solve — ⛔ themselves replaced by the live camera's (`D145`) |
| the fuchsia offer | `D109` | its cone is the **snap cone angle** (CAPTURE) |
| `CameraOffsetZoneEnter` (empty) | `D109` | — |
| a Shift + left drag on empty space zooming (a pinch of two mouse-made touches) | `D118` | the wheel |
| aligning on the second touch's PRESS | `D119` | aligning on its released TAP |
| `D89`: a second touch on the frozen plate selects it | `D119` | a tap on it aligns; a press steers |
| the white capture contour and shell; the camera swing at capture (`D63`) | `D120` | — (the snap never used them) |
| a second touch on another body GRABBING it (two bodies moved at once, tablet only) | `D124` | it steers the held body; a tap aligns |
| a free body's second touch in `TRANSLATE` giving only gravity | `D123` | gravity + a spin about gravity |

## 4. The HUD's first line (`D112`)

`score  N episodes  mm:ss  undo=K` — the touchpoint episodes counted by `SCORE.md` §3 (camera,
toggles and steering fingers are free; the undo pair costs one; ⭐ a two-touch action — align, unalign,
a Pioneer's release, unsnap — is ONE, on both devices, and lands when its LAST touch lifts, shown
meanwhile as `(+1 on release)`, `D115`), the time since the first press,
and how many actions can be undone. ⭐ `FREE FLOW (not scored)` replaces the count while the cursor
drag is on.

## 5. ⭐ Device checklist — what the 2026-09-29 deploys add (`D155`–`D172`)

✅ **CLOSED BY THE OWNER, 2026-09-30** — *"Checked and all closed"* (with everything since `D106`). The list stays as the record.

⛔ Unjudged by a hand; check the HUD's `build` line first. Each line: what to do → what should happen.

**Desktop (mouse + keyboard)**

| # | do | expect |
|---|---|---|
| 1 | left-drag a part, press **Space** mid-drag (`D155`) | it stops at once; the face you grabbed turns fuchsia (HitFace) and stays after you release the button; ⭐ the episode count does NOT change yet (`D159`) |
| 2 | left-press a part and hold still, press **Space** (`D155`) | same: no movement, the pressed face turns fuchsia |
| 3 | after 1 or 2, a **plain click** (left or right, no Space) on a face of another part (`D159`) | the first part aligns to it (cyan / amber) |
| 4 | right after 3, keep Space held and click a part (`D155`) | an ordinary click — no new HitFace until Space is released or hit again |
| 5 | **Space + click** an aligned part, then a **plain click on empty space** (`D156`/`D159`) | it unaligns (outlines gone); on a Pioneer, its followers are released |
| 6 | Space + click a part, then **Esc** | the HitFace is cancelled, nothing else happens |
| 7 | **Space + click** a part, then a **plain right click** on another part | it aligns |
| 7b | **Space + click** a part, then a **plain click on the same part** (`D160`) | the HitFace is cancelled; **+0** — after a drag that moved + Space, **+1** (the move) |
| 7c | **right click** a part and release, then a **plain click** on another part (`D161`) | it aligns — **+1**; on empty space (an aligned part): unaligns; on the same part: cancelled, **+0** |
| 7d | right **HOLD** a part + left click another part (unchanged) | it aligns, and the HitFace lifts with the right button — no latch |
| 7e | press (touch, left or right) an ALIGNED part and hold (`D162`) | its Pioneer face fills amber; on release it returns to the amber contour (a right click that latches reverts too) |
| 7f | Space + click (or right click and release) an ALIGNED part (`D163`) | the clicked face shows a FUCHSIA contour, on top of the cyan outline |
| 7g | look at an aligned couple (`D164`) | the aligned part's gizmo ring (at its FollowerFace) is AMBER; the Pioneer's cursor ring is CYAN — visible on the amber fill while the part is pressed |
| 7h | FACE ALIGNMENT › *face highlight opacity* (`D165`) | the cyan and amber fills are faint by default (0.17, `D166`); the slider (below *highlight offset*) sets it live, 0–1 |
| 7i | look at the Pioneer's cursor ring (`D166`) | as thin as the white ring, a little larger (1.3×), and the SAME size on the glass wherever the Pioneer is |
| 7j | seat a follower on its Pioneer, then drag the follower (`D166`) | the whole assembly moves; the red / blue axes and the white ring show on the PIONEER |
| 7k | press a free part and **tap Shift** (`D167`) | the HUD shows `[ROTATE]`; a drag turns the part; tap again → `[TRANSLATE]`; **Ctrl** + drag now translates |
| 7l | **Esc** mid-drag; **Alt** or **F10** mid-drag; Alt+Tab away and back (`D167`) | no jump; the browser menu is not focused; nothing in the scene changed |
| 7m | in `ROTATE`, press a free part, turn it, then hold still (touch or click) (`D168`) | its rotation axis stays on screen — no flicker |
| 7n | align a part, hold a second finger (or Shift) down, drag the part onto its seat; then move that second finger / the mouse sideways; then lift it and press a NEW one (`D172`) | no roll from the finger that was down at the snap; the NEW one rolls the seated part |

**Both devices — the episode count, first HUD line** (`D158`/`D159`)

| # | do | expect |
|---|---|---|
| 8 | tap or click a part and release, no movement | **+0** |
| 9 | right-click and release a part (desktop); Space alone (desktop) | **+0** |
| 10 | double tap / double click a part that has never moved, or one the last action did not move | **+0** (nothing undone) |
| 11 | drag a part, then double tap / double click it | **+1** for the drag, **+1** for the undo |
| 12 | an alignment (any way) / an unalignment | **+1** each |
| 13 | desktop: drag a part that moves, Space, then a plain click on another part to align | **+1** in all — as holding a part and tapping the Pioneer on mobile |
| 14 | desktop: drag a part that moves, Space, then **Esc** | **+1** (the move); a press held still, Space, Esc → **+0** |

⭐ The desktop ↔ mobile equivalence of every Space / right-click action, measured → `20_GAME_RULES/spec/SCORE.md` §3.3.
