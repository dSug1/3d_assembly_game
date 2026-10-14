# The hover — the fine alignment on the contact surface (prototype spec)

**Status:** built 2026-10-14 on `1.0.75-`, ⛔ **unjudged by a hand** (no device look; a hover and a capture of the orbited piece were
not run end to end in the app — vectors and a headless drag only). Pure: `src/input/hover.ts`; wired: `src/render/hover_wiring.ts`.

> *"We have built up to approach (the orbit around center dy) and roll long axis into line (the quads rotation of piece). Now we need to
> define the hover for the fine edge-to-edge alignment of the piece and assembly. I am enclined to build the hover with a translation of
> the piece or even the yellow gizmo on the collision surface, possibly for a limited amplitude, with a toggle back to orbit possible at
> any time … Check state-of-the-art literature. Propose a possible implementation."* → *"I agree with all your recommendations"*, with
> the comments below → *"Finger / mouse noise: add the deadband. Also, use the lerp that we implemented on other parts translation. Sway
> on hover translation: toggle the sway of other parts to minimum value"* — the owner, 2026-10-14.

It is the **hover** of `GREEN_PIECE_PHASES.md`'s child's sequence (pick the face → approach → roll the long axis into line → **hover** →
contact → seat): approach is the orbit (its dy), the long axis the quads, and the seat the goal capture (`LEVEL_END.md` §5).

## 1. The input — by WHERE the finger presses (literature: target-based modes)

| Device | Gesture | Meaning |
|---|---|---|
| touch | a drag that STARTS ON the orbited piece | **HOVER** — once past the tap's slop (`doubleTapSlop`) and only if the piece may (§2) |
| touch | a drag from empty space or a placed part | the orbit, unchanged |
| touch | a TAP on the piece | the resting face, unchanged |
| desktop | a left press on the piece + drag | **HOVER** |

Lifting the finger is the way back to the orbit — a quasimode, no toggle, no hidden mode. Separating the controls follows the multitouch
literature (Martinet, Casiez & Grisoni, *Integrality and Separability of Multitouch Interaction Techniques in 3D Manipulation Tasks*;
Nacenta et al., GI 2009); sliding on contact surfaces, Oh & Stuerzlinger (GI 2005). ⛔ The owner: *"reapply methods only if they are
patent-free and license-free"* — so NO magnetic snap of the Oh Snap / SnapAndGo kind is built (its patent status cannot be checked here);
only the project's own solver and goal capture are used.

## 2. When — the resting face AGAINST a part's face

`hoverContact`: among the bodies near the piece (`bodiesWithin`), one whose face the RESTING face lies against — **anti-parallel** (within
`HOVER_ALIGN_DEG`, 2°: the quads align exactly, this is numerical room) and **in contact**. ⭐ The contact threshold from the game's own
geometry (`hoverContactM`): the piece rests at the gap kept (`pieceGapMm`, 1 mm), is admissible down to half of it, and the advancement
stops within `AT_CONTACT_M` (0.2 mm) above it — so a piece pushed onto a face sits between 0.5 and 1.2 mm from it, and CONTACT is a gap up
to `gapM + max(AT_CONTACT_M, gapM / 2)` = **1.5 mm**. The parts' skin (0.3 mm on the glass) and the deadbands play no part: the piece's rule
is in the world. Not in contact or not aligned: the drag orbits (the HUD's verdict says why).

## 3. The move — on the contact face's plane, solved, followed

* **The plane**: the contact face's (its normal `n`); its axes the screen's right laid on it (`e1`) and `n × e1` (`e2`) — `hoverPlane`.
* **The finger** goes through the orbit band's DEADBAND (`orbitDeadbandMm` 2.3 mm, the pause `orbitBandRestMs`, the tremor rule — its own
  tracker from the press), then is solved onto both axes so the piece follows it exactly (`planeStepFromScreen`, the method of `D76`),
  × `hoverGain` (a slider; 1 = under the finger).
* **The amplitude**: held in a disc from where the hover began (`clampDisc`, `hoverAmplitudeMm` 10–500 mm, a slider; **500 = unlimited**).
* **Collision**: every step SOLVED by the orbit's own rule (`solveOrbitStep` on the plane's two coordinates — the second offset into the
  solver's 0 … 1 by `HOVER_SPAN_M`): the contact face's gap stays (the plane is parallel to it), every OTHER face stops and slides it
  (`COLLISION.md` §12octies).
* ⭐⭐ **Across COPLANAR faces** (the owner: *"make sure that if collision faces are coplanar, the hover can continue over several parts'
  collision faces, provided within the max hover distance … the piece should be able to slide over the two white and one black parts"*):
  at the hover's start, every part lying WHOLLY behind the contact face's plane (`bodiesBehindPlane`, within half the gap kept) is left
  out of the hover's checks — a piece in front of that plane, moved parallel to it, can never reach one (its distance to such a body never
  falls under its distance to the plane). So the piece slides across the flush tops of several parts as across one, within the amplitude;
  a part RISING above the plane (a wall, a taller neighbour) still stops and slides it. ⚠ Past the last coplanar face the piece goes on
  over the void at the same height — the hover never drops it.
* **The lerp**: the DRAWN offset follows the solved one on the part translation's own follower (`advanceFollow`, `translateInertiaMs`,
  `translateDampingRatio`, the phantom lead `translateLeadMs`), each frame (`hoverFrame`), settling after the release.
* **What moves** (`hoverGizmoMove`, a slider): **1** (default) the yellow GIZMO, the piece riding its ring with it — the misplaced-by-eye
  gizmo is corrected and every later orbit turns about it; **0** the piece alone, an offset on its ring place, **dropped by the next orbit
  drag** (*"Cleared on orbit"*), eased out.

## 4. The camera — the hover view, in and out by the finger's travel

The **hover view** (`hoverCameraPosition`): looking at the piece's contact point along the face's normal, at the boot distance from the
piece (`bootCamPieceDistM`, measured at the first frame), turned by the CAMERA OFFSET's yaw and pitch (*"Distance + angles"*), kept 3° off
the vertical (a camera looking straight down has no up). Reached by the hover drag's travel and left by the next ORBIT drag's travel — the
way out is the orbit coming back — `hoverCameraGain` of the way per mm (a slider), eased (`hoverViewProgress`, `hoverViewWeight`). Its target
stays where the first hover began while the view lasts (the scene does not slide under the finger).

## 5. The sway — at its least

A hover is a slide along a part, so the other parts swing at the orbit sway's SLIDING angle — its least, `ORBIT_SWAY_MIN_DEG` **0.1°**,
whatever the slider; 0 with the slider at 0 (`hoverSwayDeg`). Kicked by the hover finger's own trigger (`SwayWatcher`), about the placed
parts' barycentre, carried the way the piece moves.

## 6. The finish — the goal capture

Hover only brings the piece close: the goal capture (`D183`, `LEVEL_END.md` §5) pulls it onto its exact goal — for the orbited piece too,
during the orbit and the quad turns (`LEVEL_END.md` §5quater).

## 7. Not done / open

* ⛔ No device look; no end-to-end run of a hover or of the orbited piece's capture in the app.
* The hover is not an episode yet (`SCORE.md`).
* A held turn, a way in / out round a piece, or the second touch held: no hover (the drag orbits).
