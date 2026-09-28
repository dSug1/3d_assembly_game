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
| — | ⭐ **double tap on any body** | **undo the last action** — move, turn, alignment, snap, unsnap, release; again to go further back (`D111`) |
| nothing | single tap anywhere | ⛔ nothing (`D108`: no longer toggles) |
| a FREE body | 1st finger drag, `TRANSLATE` | slide it in its own horizontal plane (boot-fixed axes) |
| any body, being TRANSLATED | ⭐ **both fingers move sideways in OPPOSITE directions, with no `dy`** — a horizontal pinch, the 2nd finger anywhere (empty space, the body, another body) | **zoom** (spreading = zoom in, closing = zoom out, as the empty-space pinch); the **translation and the roll are PAUSED**. ⚠ Latched: once read as a pinch, it stays a zoom until a finger lifts (`D137`) |
| a FREE body | 1st finger drag, `ROTATE` | yaw about the vertical + pitch about the boot camera's right |
| a FREE body | 2nd finger `dy` / `dx` (empty space, the body, or ANOTHER body), `TRANSLATE` | lift along gravity / ⭐ **spin about gravity**, together — the aligned body's pair, with gravity for the normal (`D123`) |
| a FREE body | 2nd finger `dx` (empty space, the body, or another body), `ROTATE` | roll about the depth axis |
| a FREE body, no followers | ⭐ 2nd finger **tap on empty space** | **toggle `TRANSLATE` ↔ `ROTATE`** — the only toggle (`D108`) |
| any body (its face = the HitFace) | 2nd finger **TAP a face on another body** — press and release, short and still | align: the held face turns to point AT the tapped one (anti-parallel); replaces any earlier alignment. ⛔ `D119`: a 2nd finger that PRESSES and stays, or moves, aligns nothing |
| any body | 2nd finger **TAP the frozen plate** | align to the plate's face under the finger (`D119`) |
| any body | 2nd finger **press / drag on ANOTHER body** — frozen plate or not | ⭐ it STEERS the held body (`dy` lifts, `dx` spins or rolls) and never grabs the other one: two bodies are no longer moved at once (`D124`, `D119`). ⛔ Except a body SEATED in the held body's assembly — the unsnap's touch |
| an ALIGNED body | 1st finger drag, any mode | slide it in its horizontal plane (`D108`: mode-less) |
| an ALIGNED body | 2nd finger `dy` / `dx`, anywhere (another body included) | lift along gravity / spin about the aligned normal, together |
| an ALIGNED body | 2nd finger tap on empty space | **unalign** it (`D95`) |
| a PIONEER (has followers) | 2nd finger tap on empty space | **release all its followers** (`D107`) |
| a SEATED member | 1st finger drag | the whole assembly translates (`D102`); its rotation stays its own twist |
| the Pioneer, then press the Follower | rapid zoom-out (fingers spread) | **unsnap** (`D100`; window / leg sliders in CAPTURE) |
| — | press within the ring's grab radius | drag the PioneerFaceCursor along its face — ⚠ only in **Free Flow** (ships OFF) |

⭐ **Automatic, not an input**: the **snap** — an aligned Follower whose FollowerFace centre comes
within the capture offset of its PioneerFaceCursor, normals within the **snap cone angle**, lerps
onto it and is seated (`D100`).
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
| nothing | double left click on empty space | reset the camera |
| — | ⭐ **double left click on any body** | **undo the last action** (`D111`) |
| a FREE body | left drag | translate in its horizontal plane (`D108`: no mode on desktop) |
| a FREE body | **Ctrl** + left drag | rotate: yaw + pitch |
| a FREE body | Shift + left drag | gravity (`dy`) + ⭐ **spin about gravity** (`dx`) (`D123`) |
| a FREE body | Ctrl + Shift + left drag | roll (`dx`) |
| an ALIGNED body | left drag (Ctrl or not) | slide in its horizontal plane |
| an ALIGNED body | Shift + left drag | gravity (`dy`) + spin about the normal (`dx`) |
| — | **right-press and hold** on a face | that face is the HitFace; the right button never moves anything |
| right-hold | left click on another body's face | align — ⭐ on the click's RELEASE, like a tap (`D119`) |
| right-hold | left drag on another body | ⭐ steers the right-held body, like a drag on empty space — never moves the other (`D124`) |
| right-hold on an aligned body | left click on empty space | unalign it |
| right-hold on a Pioneer | left click on empty space | release all its followers |
| the Pioneer, then the Follower | rapid move | unsnap |
| — | left press inside the ring | drag the PioneerFaceCursor — ⚠ Free Flow only |
| — | Esc, or the window losing focus | lift the Shift-made second touch |
| nothing | Shift + left drag on empty space | ⛔ nothing — it no longer zooms (`D118`); the **wheel** is the desktop's zoom |

⛔ Shift and Ctrl are **modifiers of a movement already engaged** — neither is a touchpoint episode
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
| any tap toggling the mode | `D108` | tablet: one tap on empty space, free body held; desktop: Ctrl |
| the pinned Pioneer (`pioneerTranslates=0`) | `D109` | an aligned Follower's second finger drives both axes anywhere |
| `worldAxisB=0`, `translatePairing=0` | `D109` | boot-fixed axes, plane solve — the only ones |
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
