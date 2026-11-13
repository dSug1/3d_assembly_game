# THE TUNING MENU — by subject, cleaned (2026-11-13)

> **STATUS** · ✅ built (`1.0.130from1.0.128-Cleaned-sliders`) · ✅✅ closed by the owner's look (2026-11-13, `ddd2572`)
> **OWNS** · where every slider lives (☰), why a slider was removed, the rules for adding one
> **READ IF** · you add, move or remove a slider, or look for one
> **LAST VERIFIED** · 2026-11-13 (88 sliders; 1706 vectors)

## 1. The owner's words

> *"Sliders cleaning: remove all the float sliders which are currently set to zero (float sliders means they are not toggle sliders) used in a
> multiplication somewhere … Delete the functions which use them … before deleting, do a sanity check if it is safe to delete and then proceed."*
> *"Propose how to better organize the sliders: rendering (for highlights, opacity, etc.), camera menu and submenus … gizmo and red/green sections,
> approach and snap, etc. Propose a full architecture so I can validate before you proceed."* → *"legacy sliders can go if they are not used or toggle
> to something which does not exist any longer. agree with all your recommendations. proceed"*

## 2. The cleanup

**The float sliders at zero** (the inventory: all 92 sliders are `tunable(...)` — three floats at 0; `orbitSwayKind` = 0 is a CHOICE, the swing, kept):

| slider | value | what read it | at 0 | deleted |
|---|---|---|---|---|
| `cameraLeashDeg` | 0 | the follow camera's leash (`cameraOrbitStep`, `leashInV`) and the box's drag gains (`leashGain`, `boxDragGains`) | the camera ON the box; the gains 1 | the leash, `leashInV`, `leashGain`, `boxDragGains`, `greenDragGains`, `orbitDegPerMm`'s `gains` |
| `cameraFollowMs` | 0 | the camera's time lag (`cameraLag`) | the target itself | `cameraLag` |
| `cameraSettleDelayMs` | 0 | the window after an input stops (`axisStep`) | no window (a threshold, not a product — the same: no effect) | the parameter |
| `boxGainInsideLeash` | 0.35 | `leashGain` only — with a leash of 0 there is no inside: never applied | — | the tunable |

⭐ **The sanity check, kept as the vector**: `tests/fixtures/camera_follow_leash0.json` — 1.0.130's `cameraOrbitStep` at leash 0 / settle 0 on 400 seeded
frames (drags, lifts, four releases, their glides); the step without them reproduces it **bit for bit** (`tests/zero_sliders_removed.test.ts`).

**The legacy sliders** — each traced to its readers in the assembly orbit (`orbitMode` 0):
* **removed from the menu** (they never act): the way in to the orbit around the piece — `pieceOrbitGapMinPct`, `pieceOrbitEnterMm`, `pieceOrbitReturnMm`
  (`enterPieceOrbit` / `returnToCentreOrbit` have no live caller since the way in was parked, 2026-10-12) — and `orbitCentreGraceMs` (only after an
  empty-space press moves the centre: `EMPTY_PRESS_MOVES_TARGET` is off since 2026-10-02). Their config values stay: the parked code still names them.
* **kept, in LEGACY**: `orbitMode` (1 = the gizmo's 2D curve, kept whole), `topRollBandDeg` and the turn governor's two caps — they act only there.
* **NOT legacy after all** (found live, moved to their subject): the rings (ring 1's distance is the far orbit, the waist the approach's straight-in; the
  3rd ring's switch scales the elevation gain), the goal capture (`captureOffsetMm`, `snapConeDeg` — the placed report's fit; `snapMs` — the orbited
  piece's pull), the parts' follow (inertia, damping, lead — the demo's moves and the sway), the sway softnesses.

## 3. The menu by subject

| section | folder | sliders |
|---|---|---|
| **LEVEL** | | orbited piece · lock pieces in goal · demo duration |
| | GOAL | never-grabbed mm / ° · orbited piece's goal margin mm / ° · capture offset · snap cone · snap time |
| **INPUT** | | tap max duration · motion deadband · rest floor · rest = N × event gap · orbit drag deadband · its re-arm pause |
| **ORBIT** | SPEED | yaw gain · elevation gain · box gain yaw / pitch · inertia · piece yaw per orbit yaw · close-in full distance · contact mm/mm |
| | SMOOTHING | box smoothing · gizmo ease · orbit spring · camera catch-up after release |
| | CALM ON A FACE | the seven face-span sliders |
| | TILTED POLE | on / off · speed · automatic within · camera blend · dy hold |
| **APPROACH & CONTACT** | | approach by pinch · shell offset · look at the gizmo within · piece gap · collision allowance · solver checks · contact band |
| | THE APPROACH'S DISTANCE (THE RINGS) | the four rings' radius / height, the 3rd ring's switch |
| **GIZMO & SECTIONS** | | sections drawn · faces merged within · facet's share · gizmo edge margin · yellow gizmo shown · yellow quad slice · quads' growth |
| **CAMERA** | | yaw / pitch / radius offset · centre blend |
| **RENDERING** | | piece contour opacity · face highlight opacity · quads' opacity · highlight offset · shadows · auto-shadow budget |
| **SCENE SWAY** | | sway kind / angle / slide / softness · re-trigger turn · reference speed |
| | PARTS' FOLLOW | inertia · damping · lead · translate / rotate sway softness |
| **LEGACY** | | orbit mode · top roll band · turn governor ×2 (only `orbitMode` 1) |

Every slider kept its key, range, default and comments (moved with it, by a generator — nothing retyped). ⚠ The panel remembers the open sections by
TITLE: the new titles start folded once.

## 4. Rules for a new slider

* in the section of the SUBJECT it tunes; a folder past ~9 sliders is split;
* an opacity in RENDERING; a value only `orbitMode` 1 reads in LEGACY;
* a float slider that ships at 0 and only multiplies is a feature switched off — remove it with its reader (or make it a 0 / 1 toggle);
* `tests/menu_layout.test.ts` pins the whole tree: it changes with the menu.

## 5. Vectors

`tests/menu_layout.test.ts` (3 — the tree, 88 sliders each once and live, the removed ones) and `tests/zero_sliders_removed.test.ts` (4) — red against
`854ba10` but the kept-slider check; deleted: the leash / lag vectors of `proto_green_box.test.ts` (21), `proto_menu_worldspace.test.ts`, the CAMERA
subsections' describe; the pins moved to the new sections. **1706**.

✅✅ **The owner (2026-11-13, on the device, `ddd2572`): *"changes are ok"*.**
