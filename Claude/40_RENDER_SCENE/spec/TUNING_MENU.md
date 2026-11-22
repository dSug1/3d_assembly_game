# THE TUNING MENU — by subject, cleaned (2026-11-13)

> **STATUS** · ✅ built (`1.0.130from1.0.128-Cleaned-sliders`) · ✅✅ closed by the owner's look (2026-11-13, `ddd2572`)
> **OWNS** · where every slider lives (☰), why a slider was removed, the rules for adding one
> **READ IF** · you add, move or remove a slider, or look for one
> **LAST VERIFIED** · 2026-11-18 (118 sliders, pinned by `tests/menu_layout.test.ts`; 2091 vectors)

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
| **LEVEL** | | orbited piece · lock pieces in goal · demo duration · background blue · model stage |
| | BOOT ANIMATION | on · pop · hold shortest / longest (each piece its own) · fall from 3 units (gravity) · rebound · turns · camera pulls back from · camera sweeps from (`ANIMATION.md`) |
| | GOAL | never-grabbed mm / ° · orbited piece's goal margin mm / ° · capture offset · snap cone · snap time |
| **INPUT** | | tap max duration · motion deadband · rest floor · rest = N × event gap · orbit drag deadband · its re-arm pause |
| **ORBIT** | SPEED | yaw gain · elevation gain · box gain yaw / pitch · inertia · piece yaw per orbit yaw · close-in full distance · contact mm/mm |
| | SMOOTHING | box smoothing · gizmo ease · orbit spring · ⭐ the camera's roll behind the orbit's (`rollFollowMs`, 160 ms since 2026-11-18 — the owner's word; 200 before; 60 – 600; with law U on it acts only when `uprightPicture` is 0) · ⭐ a change of frame under this angle makes no timed turn (`freeTurnMaxDeg`, 90°, 0 – 90; 0 = today's turns, bit for bit) — both 2026-11-18, [`FAST_ORBIT.md`](FAST_ORBIT.md) §14 · camera catch-up after release · ⛔ (2026-11-22, R6 — [`PICTURE_REBUILD.md`](PICTURE_REBUILD.md) §8.6) the roll follower and the shadow deleted: `rollFollowMs` the clock of the piece's shown direction's rest alone (`asmDirEase.own`), `freeTurnMaxDeg` read by the carried up's change (`changeSeen`), its 0 deleted (5 – 90) |
| | UPRIGHT PICTURE | ⭐ (2026-11-18, law U — [`UPRIGHT_PICTURE.md`](UPRIGHT_PICTURE.md) §2, §5) the picture turned so gravity is on the screen's vertical (`uprightPicture`, 1; 0 = FO3 S1's roll follower) · ⛔ (2026-11-19, the rebuild, §12 – §13) `uprightFreeTurns` and `uprightBandFree` DELETED with their code: a change of frame is decided once, as the player sees it (`changeSeen`) — they were a change of frame of any angle made untimed where upright at both ends (1; 0 = only under `freeTurnMaxDeg`), and a change under `freeTurnMaxDeg` untimed near the vertical too (1; 0 = timed in the band) · upright close in under the square camera too (`uprightCloseIn`, 0) · none within this of the vertical (`uprightFromDeg`, 5°, 0 – 45) · in full from this off the vertical (`uprightFullDeg`, 25°, 0 – 60) · ⭐ (fix round 1, §7) the pace the picture rights itself at, everywhere (`uprightMaxDegS`, ⭐ 1 800 °/s since fix round 3, §11 — 1 440 before; 0 = at once, law U as first built; 0 – 2 880; ⭐ fix round 2, §9: its label *the rest to upright, its pace*) · ⭐⭐⭐ (2026-11-20, `1.0.148e-` — [`UPRIGHT_CARRIED_UP.md`](UPRIGHT_CARRIED_UP.md) §7.6) the carried up: `uprightCarried` (1 on that branch; 0 = law U frame for frame), `uprightAlignPerYaw` (0.5, 0 – 1: the dx's budget, a share of the yaw step — `uprightAlignDegPerMm`, 3° a mm, before fix round 1), `uprightHalfHold` (1; 0 = the gizmo never held by the half turn); the band 15 / 50° and 520° a second since 2026-11-19 / 20 · ⭐⭐⭐ (2026-11-20, packet J — [`UPRIGHT_CARRIED_UP.md`](UPRIGHT_CARRIED_UP.md) §8.9) `uprightFraming` (1; 0 = the live build `28a29ca`): a change applied at once drawn from the pose shown, the piece carried straight on the glass; ⚠ fix round 1 reverted (`91168cd`): `uprightAlignDegPerMm` (3° a mm) again, `uprightAlignPerYaw` gone · ⛔ (2026-11-22, R6 — [`PICTURE_REBUILD.md`](PICTURE_REBUILD.md) §8.6) `uprightPicture`, `uprightCloseIn`, `uprightCarried`, `uprightFraming` DELETED with law U and their 0 paths: the carried up and J always |
| | CAMERA FOLLOWER | ⭐ (2026-11-20, packet G — [`CAMERA_FOLLOWS_GIZMO.md`](CAMERA_FOLLOWS_GIZMO.md) §13) far out the camera a simple polar orbit, world up (`cameraFollower`, 1 on the branch `1.0.150-`; 0 = the live build, frame for frame) · ⭐ (2026-11-21, packet R2 — [`PICTURE_REBUILD.md`](PICTURE_REBUILD.md) §8) **the picture's rebuild, its one switch** (`pictureOne`, 1 on `1.0.153-`: close in's camera turns about the piece; ⭐ R3: one picture at every distance; 0 = `620f227` frame for frame) · ⭐ (2026-11-21 night, R3-FIX) R5's far top rule behind its own switch (`pictureFarTop`, **0** by default: its gates unfinished; 1 = R5 as built, with `pictureOne` 1 only) · ⭐ (2026-11-21, packet R3a — [`PICTURE_REBUILD.md`](PICTURE_REBUILD.md) §8.2) the picture's band: far to close over his last mm of approach finger before 0.65 m (`pictureBandMm`, 10 mm — ⛔ 40 tried and reverted 2026-11-21: it reached the far rest; 0 – 100, step 1; 0 = no band) · its one ease on the sphere (`followMs`, ⭐ 200 ms since 2026-11-21 — the owner: *"at 200 ms is better at far out distance. Increase the slider up to 500 ms with 10 ms increment and set default to 200ms"*; 120 before, the calm's it replaced; 0 – 500, step 10) · round the vertical no nearer than (`followPoleDeg`, 30° — his D-F1; 0 = over it) · the detour from (`followFromDeg`, 60°) · the yaw's last-resort ceiling, never under his pace (`followMaxDegS`, 900°/s; 0 = none) · ⭐ (2026-11-20, packet H2 — §16) the top's rule (`followTop`, 1 on `1.0.151-`; 0 = `de4a10e`, the detour, frame for frame) · an edge's gap paid by a turn from (`followTurnMinDeg`, 10°; under it the spring) · the edge's turn at his pace (`followTurnPace`, 1 = his own orbit pace when faster than close in's `tiltRollDegS`; 0 = close in's speed) · ⭐ (2026-11-21, packet H3 — §18) these two now in the folder **THE EDGE'S TURN** with the fixes F-1 – F-3 (all three 0 = `ba369aa` frame for frame): the turn only where the level heading itself jumps (`followTurnOnJump`, 1) · the turn at his finger's pace (`followTurnFinger`, 1; 0 = the orbit's pace, no top speed) · **the 180° realignment's top speed** (`followTurnMaxDegS`, 520°/s; 0 – 2000, step 10; 0 = none; with `followTurnFinger` 1) · the gizmo really waits: the angles set to its place when a turn starts (`followTurnRebase`, 1) · ⛔ (2026-11-22, R6 — [`PICTURE_REBUILD.md`](PICTURE_REBUILD.md) §8.6) `cameraFollower`, `pictureOne`, `followFromDeg`, `followMaxDegS`, `followTop` and THE EDGE'S TURN's `followTurnOnJump`, `followTurnFinger`, `followTurnRebase` DELETED with their 0 paths (the one picture, the top's rule, H3 always); kept: `pictureFarTop` (both), `pictureBandMm`, `followMs`, `followPoleDeg`, `followTurnMinDeg`, `followTurnPace`, `followTurnMaxDegS` · ⭐ (2026-11-22, [`CAMERA_FOLLOWS_GIZMO.md`](CAMERA_FOLLOWS_GIZMO.md) §19, D-H20 — his back and forth at a facet change far out) THE EDGE'S TURN + **the edge's turn aimed where the gizmo waits** (`followTurnAtGizmo`, 1; 0 = `4dbd704` frame for frame) · ⭐ (2026-11-22 evening, D-H23 — [`CAMERA_FOLLOWS_GIZMO.md`](CAMERA_FOLLOWS_GIZMO.md) §20) the edge's jump read at ONE place — the crossing of the calm's source, both sides at this frame's angles; inside one face no jump, the spring pays the share's ramp (`followJumpAtPlace`, 1; 0 = `40b8095` frame for frame) |
| | CALM ON A FACE | the seven face-span sliders |
| | TILTED POLE | on / off · speed · automatic within · camera blend · the way out's blend (`tiltOutBlendMm`, 12 mm; 0: timed) · dy hold (`edgeHoldMm` 8 mm of finger back, a hysteresis, step 1 — was 30, step 5: 2026-11-18, [`DY_HOLD_REVERSAL.md`](DY_HOLD_REVERSAL.md) §6) |
| | POLAR ZONES | on · upright up to · spit from · whole share · exit mm · a spit's level face: the calm (0) / square (1) · ⭐ a level face's entry (`freeEntryUpright`, 2026-11-18): the edge's layout at once (0) / the picture kept, the layout by the face's middle (1, the default) — [`LEVEL_FACE_ENTRY.md`](LEVEL_FACE_ENTRY.md) §17 |
| **APPROACH & CONTACT** | | approach by pinch · shell offset · look at the gizmo within · piece gap · collision allowance · solver checks · contact band |
| | THE APPROACH'S DISTANCE (THE RINGS) | the four rings' radius / height, the 3rd ring's switch |
| **GIZMO & SECTIONS** | | sections drawn · faces merged within · facet's share · gizmo edge margin · yellow gizmo shown · yellow quad slice · quads' growth |
| **CAMERA** | | yaw / pitch / radius offset · centre blend · browsed centre's travel |
| | IDLE ORBIT | on · after · yaw / pitch swing · loop · catch back mm / ms (`ANIMATION.md`) |
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

`tests/menu_layout.test.ts` (3 — the tree, 118 sliders each once (88 on 2026-11-13) and live, the removed ones) and `tests/zero_sliders_removed.test.ts` (4) — red against
`854ba10` but the kept-slider check; deleted: the leash / lag vectors of `proto_green_box.test.ts` (21), `proto_menu_worldspace.test.ts`, the CAMERA
subsections' describe; the pins moved to the new sections. **1706**. ⭐ Since: **134 sliders** (2026-11-22 evening, + `followJumpAtPlace` in ORBIT › CAMERA FOLLOWER › THE EDGE'S TURN — D-H23, [`CAMERA_FOLLOWS_GIZMO.md`](CAMERA_FOLLOWS_GIZMO.md) §20); **133 sliders** (2026-11-22, + `followTurnAtGizmo` in ORBIT › CAMERA FOLLOWER › THE EDGE'S TURN — D-H20, [`CAMERA_FOLLOWS_GIZMO.md`](CAMERA_FOLLOWS_GIZMO.md) §19); **132 sliders** (2026-11-22, − 12 with their 0 paths: UPRIGHT PICTURE's four, CAMERA FOLLOWER's five, THE EDGE'S TURN's three — R6, [`PICTURE_REBUILD.md`](PICTURE_REBUILD.md) §8.6); **144 sliders** (2026-11-21 night, + `pictureFarTop` in ORBIT › CAMERA FOLLOWER — R3-FIX); **143 sliders** (2026-11-21, + `pictureBandMm` in ORBIT › CAMERA FOLLOWER — packet R3a); **142 sliders** (2026-11-21, + `pictureOne` in ORBIT › CAMERA FOLLOWER — packet R2); **141 sliders** (2026-11-21, + `followTurnOnJump`, `followTurnFinger`, `followTurnMaxDegS`, `followTurnRebase` in ORBIT › CAMERA FOLLOWER › THE EDGE'S TURN — packet H3); **137 sliders** (2026-11-20, night, + `followTop`, `followTurnMinDeg`, `followTurnPace` — packet H2); **134 sliders** (2026-11-20, + the CAMERA FOLLOWER five — packet G); **126 sliders** (2026-11-18, + `freeEntryUpright`, then + `rollFollowMs` and `freeTurnMaxDeg` — FO3 S1, then the six of UPRIGHT PICTURE — law U, then `uprightBandFree` (127), then − `uprightFreeTurns` and `uprightBandFree` (125, 2026-11-19, the rebuild, `UPRIGHT_PICTURE.md` §13); the count's one home is `tests/menu_layout.test.ts`).

✅✅ **The owner (2026-11-13, on the device, `ddd2572`): *"changes are ok"*.**
