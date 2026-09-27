# INPUTS TABLE — every input the build answers, and what it does

> **STATUS** · live · **OWNS** · the one list of inputs, tablet and desktop
> **READ IF** · you are about to add, change or remove a gesture — or to judge one on a device
> **LAST VERIFIED** · 2026-09-27 (`1.0.40-Undo-and-episodes`, `D106`–`D112`)

⭐ The rules and their reasons live in [`ALIGNMENT_RULES.md`](ALIGNMENT_RULES.md) (§12 for this
pass) and [`SPEC_INPUT_SYSTEM_R5.md`](SPEC_INPUT_SYSTEM_R5.md); this page is the inventory.
⛔ **No row here is judged by a hand yet** since the 2026-09-27 simplification — rule 5 is owed.

## 1. Tablet (touch)

| holding | input | does |
|---|---|---|
| nothing | 1 finger drag on empty space | orbit the camera (three rings) |
| nothing | 2 fingers pinch on empty space | zoom |
| nothing | double tap on empty space | reset the camera |
| — | ⭐ **anything in the EDGE BAND** (6 mm along the screen edges, dashed line) | empty space, whatever is drawn there — so a double tap there always resets the camera, one finger orbits, two pinch (`D113`) |
| — | ⭐ **double tap on any body** | **undo the last action** — move, turn, alignment, snap, unsnap, release; again to go further back (`D111`) |
| nothing | single tap anywhere | ⛔ nothing (`D108`: no longer toggles) |
| a FREE body | 1st finger drag, `TRANSLATE` | slide it in its own horizontal plane (boot-fixed axes) |
| a FREE body | 1st finger drag, `ROTATE` | yaw about the vertical + pitch about the boot camera's right |
| a FREE body | 2nd finger `dy` (empty space or the body), `TRANSLATE` | lift / lower along gravity |
| a FREE body | 2nd finger `dx` (empty space or the body), `ROTATE` | roll |
| a FREE body, no followers | ⭐ 2nd finger **tap on empty space** | **toggle `TRANSLATE` ↔ `ROTATE`** — the only toggle (`D108`) |
| any body (its face = the HitFace) | 2nd finger **press a face on another body** | align: the held face turns to point AT the pressed one (anti-parallel); replaces any earlier alignment |
| an ALIGNED body | 1st finger drag, any mode | slide it in its horizontal plane (`D108`: mode-less) |
| an ALIGNED body | 2nd finger `dy` / `dx`, anywhere | lift along gravity / spin about the aligned normal, together |
| an ALIGNED body | 2nd finger tap on empty space | **unalign** it (`D95`) |
| a PIONEER (has followers) | 2nd finger tap on empty space | **release all its followers** (`D107`) |
| a SEATED member | 1st finger drag | the whole assembly translates (`D102`); its rotation stays its own twist |
| the Pioneer, then press the Follower | rapid zoom-out (fingers spread) | **unsnap** (`D100`; window / leg sliders in CAPTURE) |
| — | press within the ring's grab radius | drag the PioneerFaceCursor along its face — ⚠ only in **Free Flow** (ships OFF) |

⭐ **Automatic, not an input**: the **snap** — an aligned Follower whose FollowerFace centre comes
within the capture offset of its PioneerFaceCursor, normals within the **snap cone angle**, lerps
onto it and is seated (`D100`).
⚠ A frozen body (the plate): a FIRST touch on it is a miss (it drives the camera or another body);
a second touch on it may pick it as the Pioneer (`D89`).

## 2. Desktop (mouse — a two-touch device, `D94`)

| holding | input | does |
|---|---|---|
| nothing | left drag on empty space | orbit the camera |
| — | wheel | zoom |
| nothing | double left click on empty space | reset the camera |
| — | ⭐ **double left click on any body** | **undo the last action** (`D111`) |
| a FREE body | left drag | translate in its horizontal plane (`D108`: no mode on desktop) |
| a FREE body | **Ctrl** + left drag | rotate: yaw + pitch |
| a FREE body | Shift + left drag | gravity (`dy`) |
| a FREE body | Ctrl + Shift + left drag | roll (`dx`) |
| an ALIGNED body | left drag (Ctrl or not) | slide in its horizontal plane |
| an ALIGNED body | Shift + left drag | gravity (`dy`) + spin about the normal (`dx`) |
| — | **right-press and hold** on a face | that face is the HitFace; the right button never moves anything |
| right-hold | left click on another body's face | align |
| right-hold on an aligned body | left click on empty space | unalign it |
| right-hold on a Pioneer | left click on empty space | release all its followers |
| the Pioneer, then the Follower | rapid move | unsnap |
| — | left press inside the ring | drag the PioneerFaceCursor — ⚠ Free Flow only |
| — | Esc, or the window losing focus | lift the Shift-made second touch |

⛔ Shift and Ctrl are **modifiers of a movement already engaged** — neither is a touchpoint episode
of its own ([`../../20_GAME_RULES/spec/SCORE.md`](../../20_GAME_RULES/spec/SCORE.md) §3).

## 3. Deleted 2026-09-27, and what replaced each

| gone | by | now |
|---|---|---|
| `FOLLOW` (double press, amber) | `D106` | every alignment is a snapshot; a **seat** carries |
| the Follower shake, the Pioneer shake | `D107` | tap empty space while holding |
| `D39`'s re-press undo | `D107` | tap empty space while holding |
| the flick's drop-alignment branch | `D107` | the flick resets rotation only |
| the flick itself (rotation reset) | `D110` | the undo |
| `D103`'s flick-unsnap (specified) | `D110` | the precise unsnap; the undo |
| the camera reset by a double tap on a BODY | `D111` | empty space — and the **edge band** is always empty space (`D113`) |
| any tap toggling the mode | `D108` | tablet: one tap on empty space, free body held; desktop: Ctrl |
| the pinned Pioneer (`pioneerTranslates=0`) | `D109` | an aligned Follower's second finger drives both axes anywhere |
| `worldAxisB=0`, `translatePairing=0` | `D109` | boot-fixed axes, plane solve — the only ones |
| the fuchsia offer | `D109` | its cone is the **snap cone angle** (CAPTURE) |
| `CameraOffsetZoneEnter` (empty) | `D109` | — |

## 4. The HUD's first line (`D112`)

`score  N episodes  mm:ss  undo=K` — the touchpoint episodes counted by `SCORE.md` §3 (camera,
toggles and steering fingers are free; the undo pair costs one), the time since the first press,
and how many actions can be undone. ⭐ `FREE FLOW (not scored)` replaces the count while the cursor
drag is on.
