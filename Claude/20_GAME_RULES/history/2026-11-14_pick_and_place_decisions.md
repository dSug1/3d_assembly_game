# 2026-11-14 — the pick-up flow: the inventory, the literature, the owner's answers

> **STATUS** · history · **OWNS** · the record of how `spec/PICK_AND_PLACE.md` was decided
> **READ IF** · you want the options that were weighed, or the sources behind a default

## The request

> *"We need to define: how we pick up a piece; how we drop a piece (if the player realizes this is not the correct piece); how the piece and camera
> are brought to their positions from scene orbit to piece orbit; how to toggle between scene orbit and piece orbit back and forth; the animations
> when the piece moves (pick up, positioning for piece orbit, snap into goal); etc. Do an inventory of what needs to be done, defined, specified.
> Check literature for state of the art solutions"* — then *"include also the clean up of the old unused methods in your inventory"* — the owner

## What the code did (checked 2026-11-14)

* No pick-up: the orbited piece (`Scene_1`'s green / turquoise box or prism) spawns in hand, switched from the menu; `Scene_2` has none, so its
  piece orbit never runs (`st.greenBox === null`).
* A press in the scene orbit arms the centre's glide; a tap moves nothing (the glide is proportional to the finger) and the yellow marker that
  "jumps" is hidden (since 2026-10-02).
* The undo (`D111`/`D141`) was deleted on 2026-11-02 (recorded the same day in `00_CORE/queue_notes/IN6.md`); a double tap only respawns
  `Scene_1`'s STUCK orbited piece.
* The old way in / out round the piece (12 mm / 30 mm of finger) has had no live caller since 2026-10-12.

## The options weighed, and the owner's answers

| question | options | the owner |
|---|---|---|
| the pick | tap · long press (~350 ms, LEGO Builder's Journey, Assemble with Care) · double tap | **tap**; a double tap on the same piece puts it down |
| two parts within reach | a magnified chooser (Shift, TapTap) · tap again to cycle | **cycle**, only as the immediate next input |
| which parts | any · the available steps only · green / amber (Car Mechanic Simulator) | **the available steps, outlined** (reappearing when a part is PLACED) |
| a single tap on the held piece vs the double tap | delay it by the double-tap window · let it turn first | **delay it** |
| a tap on another part while holding | nothing · as today | **as today** (placed: the gizmo; loose: empty space) |
| where a put-down goes | its own heap spot · a free spot | **a free spot near, by the boot's rules; the least turn to rest** |
| the transition | the clock · the finger | **the clock; inputs held until the piece and the camera are in place** |
| the lifted pose | on the piece orbit's line · straight above the heap | **on the orbit's line**, at the highest pitch |
| the start orientation | as it lay · a presentation pose | **the quad nearest its orientation as it lay** |
| back to the scene orbit | only by putting down · park and look | **the idle timer blends to the scene orbit's idle, back on input** |
| the score | each one · pick and put-down · none | **pick and put-down** (the snap is automatic) |
| animations | the table (pick-up 60–80 ms dip + 120–200 ms lift; carry 500–700 ms; put back 300–400 ms; snap ~150 ms + 3 % overshoot; plunge 150–250 ms; cap pop 170 ms) | **recorded, not built: the poses spawned** |
| sound | now · later | **later** |
| the clean-up | dead + parked · + legacy `orbitMode` 1 · `Scene_1`'s pieces and demo | **dead + parked first, bit for bit on `Scene_1`; `orbitMode` 1 kept; `Scene_1` kept, migrated later** |
| next | docs · clean-up | **docs first** |

## The literature (a research pass, 2026-11-14 — [V] read in the source, the rest inference)

* Picking on touch: LEGO Builder's Journey (touch and hold; players' accidental pick-ups) [V]; Assemble with Care (long press to detach, touch
  better than mouse) [V]; target size 9.2 / 9.6 mm (Parhi, Karlson & Bederson, MobileHCI 2006) [V]; Shift (Vogel & Baudisch, CHI 2007) [V]; TapTap /
  MagStick (Roudaut et al., AVI 2008) [V]; the bubble cursor (Grossman & Balakrishnan, CHI 2005) [V]; the depth ray (UIST 2006) [V]; Blender's
  click to cycle [V]; Car Mechanic Simulator 2021's green / yellow outlines [V]; ARCore's rule: a drag starting on the object moves it, off it the
  view [V]; Apple's lift (scale, shadow) and haptics on a snap [V].
* Dropping: LEGO's throw / hold off the studs [V]; Unpacking loosened its placement after playtests [V]; return to the heap, never punish.
* The camera: point-of-interest movement (Mackinlay, Card & Robertson, SIGGRAPH 1990) [V]; Navidget (Hachet et al., 3DUI 2008) [V]; HoverCam
  (Khan et al., I3D 2005) [V]; ViewCube (I3D 2008) [V]; van Wijk & Nuij's zoom-pan paths (2003) [V]; Cinemachine's 2 s EaseInOut default [V];
  animated transitions aid comprehension (Heer & Robertson, InfoVis 2007) [V]; durations 100–500 ms (NN/g, Material) [V].
* Modes: Raskin's quasimodes (*The Humane Interface*, 2000) [V]; a held pedal cut mode errors (Sellen, Kurtenbach & Buxton 1992) [V].
* Snapping: snap-dragging (Bier, I3D 1990) [V]; Onshape's mate connectors [V]; Puzzling Places' too-strict fit [V]; game feel (Swink 2008),
  *Juice it or lose it* (Jonasson & Purho, GDC 2012) [V].

## The clean-up inventory (a read-only sweep, callers checked, HEAD `5246b71`)

* **Dead (~1 700 lines)**: the way in / out, aim, return, roll steps and yaw-gain recompute (`render/green_box_wiring.ts`); ~540 of 606 lines of
  `input/piece_orbit.ts` (`headingAbout`, `ringDistanceRange` live); `holdDecision` / `holdSwitch` / `trailAnchor` (`input/hold_gesture.ts`); ~100
  commented lines in `render/hold_wiring.ts`; the `Recognizer` class (`TapHistory`, `isTapRelease`, `Phase` live); `core/constraint_stack.ts` and
  the object-constraint functions; `testMate` / `mateResidual`; the router's OBJECT / SECOND roles; the dead state fields.
* **Parked (~170)**: `EMPTY_PRESS_MOVES_TARGET`, the pending centre, `recomputeOrbitCentre`, the barycentre centre.
* **Legacy (~250, kept)**: `orbitMode` 1 — the turn governor, the top pause, the ring-curve branches.
* **Config keys read only by dead code**: `pieceOrbitEnterMm`, `pieceOrbitReturnMm`, `pieceOrbitGapMinPct`, `evictOnOverflow`, `translateSwayMm`
  (`tests/config_debt.test.ts` checks a key is READ, not that its reader is live).
* **Traps**: the `input/index.ts` barrel; types shared with live code (`Phase`, `PointerRole`, `Constraint` — a field of every scene object —,
  `Placed`); `green_box_wiring.ts` mixes dead and live arms in one function; `tests/unwired_debt.test.ts`'s pending list.
