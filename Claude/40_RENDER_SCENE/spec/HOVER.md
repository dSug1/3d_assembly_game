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
* **The lerp**: the DRAWN offset follows the solved one on the part translation's own follower (⛔ §9: drawn only, never the model) (`advanceFollow`, `translateInertiaMs`,
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

## 8. The second pass (2026-10-14) — face to face, the reach and the settle, contact made visible, the orbited piece's own margins

> *"I can't hover translate in the attached configuration. Make sure the threshold distance is between resting face and collision face.
> Or check what else is bugging."* · *"I think the contact check is too strict. It is difficult for the user to judge the contact depending
> on the camera view. Also, it may be difficult to achieve the contact based only on orbit movement. Propose something to ease the contact
> and its perception by the user"* → *"Build A&B"* · *"the green piece is declared having achieved its goal: this is wrong: not centered,
> not aligned in quad rotation"* — the owner.

* ⭐⭐ **FACE TO FACE** (`hoverFaceContact`): the distance is the resting face's centre above the PLANE of each face of each part within
  reach, that face anti-parallel to the resting face (2°) — ⛔ it compared the resting face with the normal of the bodies' CLOSEST POINTS,
  which tilts when those fall on an edge. The hosting face's own normal is the hover plane's; its own plane is where the coplanar test
  (`bodiesBehindPlane`) is levelled.
* ⭐⭐⭐ **WHY "CONTACT" WAS UNREACHABLE BY EYE** (measured): a part's collision surface is a transparent CONTOUR 1.5 mm outside its coloured
  face, and a pushed piece rests 1 mm off it — "touching" is ~2.5 mm from the face the eye sees, unjudgeable from any camera; and the orbit
  reaches it only where its ring crosses the face. Staged headless, the hover worked at contact; the owner's attempts stood a few mm off.
* ⭐⭐⭐ **A. THE REACH AND THE SETTLE**: a resting face LOOKING AT a part's face within `hoverApproachMm` (**20 mm**, a slider; ≥ 1.5) may
  hover. Not yet in contact, the piece first SETTLES onto it: a move along the face's normal down to the gap kept, SOLVED (the face's own part
  and every other stop it), shown eased over `HOVER_SETTLE_MS` (150 ms), then it slides. Headless: from 10 mm off, settled 9.0 mm, then slid
  at 1.00 mm across five coplanar faces.
* ⭐⭐⭐ **B. CONTACT MADE VISIBLE** (`hoverVisualFrame`, the same look as the hover's start, every 100 ms when no hover is on): the **contact
  shadow** — the resting face's outline laid on the hosting face (`projectOntoPlane`), cyan; a faint **fill** on the hosting face; the resting
  face's contour turned **cyan** — *press the piece and drag*. A geometric cue only (the shadow, the classic depth cue), nothing licensed.
* ⭐⭐ **Every refusal SAYS why** on the HUD's `last` line (the nearest face, its distance and angle; a held second touch; a turn playing …).
* ⛔⛔ **THE ORBITED PIECE'S GOAL** was judged by a grabbed PART's margins — 10 mm on the GLASS at the camera's distance (182 mm at 4.25 m,
  measured) and 15°: loose on purpose for a part the capture then pulls exactly, so 35 mm off and 12° off read as placed. ✅ Its own margins,
  in the WORLD: `orbitGoalMm` **5 mm**, `orbitGoalDeg` **3°** (sliders; the quads turn exactly, so the angle is only room for rounding) →
  `LEVEL_END.md` §5quater.

## 9. The audit's fixes (2026-10-14) — the follower drawn only, what ends a hover, the view on a new face, the coplanar tie

> *"Build, update the md files, deploy, relaunch the same audit on the commits since bce905c"* — the owner, on the Fable audit of §1–§8.

* ⛔⛔⛔ **THE FOLLOWER WAS THE MODEL** (the audit's one HIGH finding): the part translation's follower (`ζ` 0.2 and a phantom lead) was
  written to the gizmo / the offset, so the model overshot a wall — **1.5 mm at 60 fps, 2.2 mm at 120** (vectored) past the 0.5 mm the
  solver keeps; the next orbit frame found the piece inside a part and its relocation jumped it ≥ 1 cm along the ring. ✅ **The MODEL is the
  solved offset** (the settle eased in, a solved move); the follower only DRAWS the piece — its lag added to the MESH (`st.hoverDraw`,
  `anchorFrame`) and taken off where the model reads the mesh (`syncOrbitPieceModel`), kept BEHIND the solved place along the last solved
  step (`hoverDrawLag`: the part ahead, or across that step, dropped).
* ⭐⭐ **WHAT ENDS A HOVER BESIDES THE LIFT** (`hoverEndsOn`): a second touch HELD (⛔ the hover went on, the centre pinned under it) or the
  piece CAPTURED onto its goal (⛔ the hover went on writing the gizmo) — it ends at its solved place, its finger handed back.
* ⭐⭐ **THE VIEW FOLLOWS A NEW FACE** (`hoverViewRetargets`): a hover begun on a face turned more than ~2.6° from the view's own retargets
  the hover view, eased from the one it leaves over `HOVER_VIEW_RETARGET_MS` (250 ms) — ⛔ it stayed on the first face.
* ⭐⭐ **COPLANAR FACES TIE** (`HOVER_TIE_M`, 0.1 mm): the face UNDER the resting face's centre hosts (the least in-plane distance) — ⛔ the
  first listed won, so the hover could be named after, and levelled on, a neighbour's face.
* ⭐ **THE PITCH TURNS UP**: on a side face `e2 = n × e1` points DOWN (Babylon is left-handed), so the CAMERA OFFSET's pitch put the hover
  view below the piece; the pitch axis is turned to point up (`pitchAxis`; a level one, on a top face, kept). ⚠ On a face tilted toward the
  camera `e2` leans down too and is flipped — no such face in `Scene_1`.
* ⭐ **THE FADE IS SOLVED**: a dropped piece-only offset (`hoverGizmoMove` 0) goes back to the ring place by the solver, the share kept as its
  one coordinate — ⛔ it was scaled down blind; blocked, it stops where it stands.
* ⭐ **THE GOALS ON THE CONTOUR**: the orbited pieces' goals sit flush on Piece4's CONTOUR (`SCENE_1_CONTOUR_MARGIN` above its coloured top)
  — ⛔ flush on the core, 1.5 mm inside the contour, the capture's pull was a penetration that waited → `LEVEL_END.md` §5quater. The
  `orbitGoalMm` slider starts at 1.5 mm (a resting piece sits 0.5 – 1.2 mm off).
* ⭐ Housekeeping: the hosting face's fill disposes its material (one leaked per face); the resting contour's colour is set only when it
  changes (it was cloned per line every frame).
* ⚠ Still open (named by the audit, not changed): the FLOOR cannot host a hover (a frozen body's faces are not looked at). ⏸ A proposal is parked → §11. ✅ The per-event
  solve is fixed by §10.

## 10. The second audit's fixes (2026-10-14) — the orbit held, one solve a frame, the travel kept, behind by height, over the face

> *"Build 1 to 12. For 9, i do not understand which drag and which stop so i cannot provide feedback. Update the md files"* — the owner,
> on the second Fable audit of everything since `bce905c`. ⛔ Unjudged by a hand; checked by 1957 vectors and a headless drag.

* ⛔⛔⛔ **1. THE ORBIT HOLDS STILL UNDER A HOVER** (`orbitFrameUnderHover`): the orbit's frame went on solving under the hover — a backlog
  continued, the way back to the ring height the finger had set, a relocation — and could lift the piece OFF the hover's plane mid-drag while
  the hover solved from where it began: a step checked at the wrong place, a penetration, the 1 cm jump of §9 by another path. ✅ While a
  hover is on, the orbit solves nothing: the piece's ring place, its target and its height are held. ✅ And a hover STARTS only from a piece
  shown AT REST on its solved place (still easing: the drag waits — *"waiting for the piece to come to rest"*), from its exact ring place, the
  orbit's backlog and coast dropped.
* ⛔⛔⛔ **2. ONE SOLVE A FRAME, INSIDE THE BUDGET** (the owner: *"do not increase the ms budget (i am testing on iphone)"*): the hover solved
  on every pointer EVENT, 24 queries each — a 125–250 Hz mouse made 48–96 a frame. ✅ Each event only ADDS its step to the hover's pending
  target; `hoverFrame` solves it once, with what the frame's `pieceSolverQueries` has left (`hoverQueryBudget`, none under 4: it waits a
  frame); the piece-only offset's fade runs on what is left after that; the settle's queries are counted. Headless, a drag at three events
  a frame peaked at 25 queries (the solver's own last check past its cap, as for the orbit).
* ⛔⛔ **3. THE FINGER'S TRAVEL IS KEPT** (`hoverPendingAfter`): a solve the cap cut dropped its rest — a 10 mm step along a wall 1.1 mm away
  moved 6.48 mm (vectored at the shipped cap). ✅ The target is kept until reached (the orbit's own rule); blocked, it is where it stopped.
* ⛔⛔ **4. "BEHIND" BY THE PIECE'S OWN HEIGHT** (`behindToleranceM`): a part may rise above the hover's plane at most the piece's height
  above it less half the gap kept — ⛔ it was half the gap kept whatever the height, so a piece hovering at 0.6 mm could pass 0.2 mm from a
  neighbour 0.4 mm proud.
* ⛔⛔ **5. THE RESTING FACE MUST LIE OVER THE FACE** (`HOVER_OVER_FACE_M`, 2 mm — the contour's room): the face's own triangles, the resting
  face's centre laid on its plane within them. ⛔ It was a body test: a piece BESIDE a box, above the plane of its top, turned cyan, and the
  settle took it down into the air. The refusal says *"not over …'s face (beside it)"*.
* ⭐ **6.** The piece and the camera read the gizmo as the hover left it THIS frame (they trailed it by one).
* ⭐ **7.** Coplanar faces tie by the face CONTAINING the centre first, then the nearer centre.
* ⭐ **8.** The settle: the MODEL settled at once (solved), the MESH drawn easing down over 150 ms — ⛔ the model eased while the steps were
  solved at the settled depth (an unchecked pose).
* ⭐⭐ **9. A CAPTURE STOPS THE DRAG THAT MADE IT** (`D139`'s rule for a snap, chosen for the owner, who could not judge the question as asked):
  the finger that hovered the piece INTO its goal moves nothing more until it lifts — ⛔ it was handed to the orbit, so the same finger, still
  moving, started turning the camera round the placed piece.
* ⭐ **10.** The HUD's zoom line says when the hover view holds the camera (*"hover view N %: the zoom held there"*).
* ⭐ **11.** Vectors that a reorder breaks (the frame's order, the captured finger) and behavioural ones for every new rule; fewer pins.
* ⭐ **12.** The dead "orbited piece always grabbed" line is removed (its own margins answer first).
* ⭐ The ready look (cyan, the shadow) runs again only when the world moved — at rest it costs nothing.

## 11. ⏸ PARKED — the floor as a hover's host (proposal, 2026-10-14; not built)

> *"How do you propose the floor to host a hover? It currently does not collide with an orbit nor a quad rotation."* → *"Capture that in the md
> file for later implementation improvement. However, without gizmo support, there is no way to bring the piece close to the hover point and
> this requires the hover distance to be unlimited. We will see later on if we implement that or if we post placeholders on the floor where a
> piece may be seated."* — the owner.

**Why the floor is not hosting today**: it is a FROZEN body, exempt from the piece's collision by design (`COLLISION.md` §11bis — the lower
rings pass under it); `hoverCandidates` looks only at bodies `bodiesWithin` reports under that setup, so its faces are never looked at.

**The proposal — the floor LOOKED AT, never collided with**: a hover needs no collision with its HOST — it slides PARALLEL to the hosting face
(its distance to that plane never changes), and the settle's target depth is computed from the face's plane (`settleDepth`), the solver
only stopping it earlier on OTHER parts.
1. **Looked at**: the ready look and `hoverStart` also take the FROZEN bodies' faces — their TOP face only (normal up; a piece below the
   floor must not hover against its underside). The floor stays exempt from every solve (orbit, quads, hover, settle).
2. **A signed settle**: the orbit passes through the floor, so the piece may be partly INSIDE it — a resting face below the floor's top, or
   nearer than the gap kept, settles UP to the gap kept (solved against the parts); deeper than the reach below, no hover. The same lift would
   serve a piece inside a part's contour.
3. **Shown as any host**: the cyan contour, the contact shadow on the floor, a faint fill of the floor's top (its own triangles, so the fill
   and the "over the face" test of §10 stay local).
4. **The hover view**: looking down at the floor, 3° off the vertical (the guard of §4).
* ⚠ Unchanged by it: once the hover ends, the orbit and the quads still ignore the floor — an orbit drag from a floor hover may carry the
  piece through it, as today. A floor that stops the orbit conflicts with the lower rings: a separate decision.
* Cost: one more body in the ready look (only when the world moved); nothing added to the 24-query budget.

⛔⛔ **WHAT BLOCKS IT (the owner)**: the orbit brings the piece near a floor point only where its ring crosses the floor — **without the GIZMO's
support** (moving the yellow gizmo onto the floor point first) there is no way to bring the piece close to WHERE it should hover, and the
hover would have to carry it the rest of the way: **an UNLIMITED hover distance** (`hoverAmplitudeMm` at its top, 500).
**Two ways forward, to be chosen later**: (a) build the proposal WITH gizmo support and an unlimited distance; or (b) **PLACEHOLDERS on the
floor** — marked seats where a piece may be set down, each a known target the piece is brought to (no free hover on the floor at all).
