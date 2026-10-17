# The hover — the fine alignment on the contact surface (prototype spec)

**Status:** built 2026-10-14 on `1.0.75-` → `1.0.76-Simplified-hover`, audited and fixed on `1.0.77-` (§20), ⛔ **unjudged by a hand** as a
whole — the owner has driven it on the device through several rounds and reported defects, each fixed (§8–§20), but never closed it. Pure:
`src/input/hover.ts` (`support_face.ts` deleted 2026-10-15); wired: `src/render/hover_wiring.ts`. Vectors: `tests/hover.test.ts`.

⭐⭐⭐ **START WITH §0** — the hover AS IT STANDS. §1–§17 are the record, in order; later sections supersede earlier ones and say so.

## 0. THE HOVER AS IT STANDS (2026-10-14, `2a54a92`) — read this first

**What it is**: the fine placement of the orbited piece (green / turquoise) on a part's face, after the orbit's approach and the quads' turn;
the goal capture then pulls it exactly (`LEVEL_END.md` §5quater).

* **Ready (the latch)** — the resting face LOOKS AT a part's face: anti-parallel within 2°, IN FRONT of its plane (§21: ≤ 1 mm behind) within `hoverApproachMm` (20 mm),
  and ANY PORTION of the resting face over that face (`overlapsTriangles`, §15 — not its centre; §18's margin deleted, §19). Shown by the resting contour turning
  GREEN #D8FDD2, the contact shadow (the resting face projected on the face), a faint fill of the face and the GREEN OUTLINE of all the
  coplanar faces joined to it (§15). Looked for every 100 ms when the world moved; frozen bodies (the floor) are never hosts (§11, parked).
* **Start** — a drag (left drag on desktop) that starts ON the piece, past the tap's slop. Refusals are named on the HUD's `last` line. The
  piece SETTLES onto the face (solved, the model at once, drawn eased over 150 ms) to the 1 mm gap kept. The orbit's backlog is dropped and the
  orbit HOLDS STILL while the hover is on (§10). Ends: the finger lifts; a second touch held; a goal capture (which spends the finger until it
  lifts, §10). ⭐ (§23) the lift STOPS the slide at once (the drawn piece where it is, the highlights off); the next press ELSEWHERE orbits, the next
  press ON THE PIECE sets the slide up again (highlights, slide). ⛔ The slide stays spent while the piece is against a face — only a press on the
  piece, or the orbit taking it out of every contact, offers it again.
* **Move** — each deadbanded finger step is read as TWO RAYS from the camera of the moment onto the face's plane (`hoverFingerStep`, §14):
  exact under the finger; a camera turn moves nothing; a ray under 12° to the plane moves nothing. × `hoverGain`; ⭐ (§23) × the KINETIC
  FRICTION `speed / (speed + hoverFrictionMmS)` (8 mm/s on the glass, 0 = off): a slow finger moves the piece less than itself; held in a disc of
  `hoverAmplitudeMm` (default 500 = UNLIMITED). The target is BOUNDED where the resting face's CENTRE stays within the drawn
  green boundary — ⭐ (§21) a step never takes it FARTHER from the boundary (`rectsDistance`, `boundStep`, `holdOffBound`): inside it cannot leave,
  outside it comes toward it or along it; slides along the edge, reversing comes back at once. Solved ONCE a frame by the orbit's solver inside the frame's
  24-query budget (`pieceSolverQueries`), the cut travel kept (§10); parts no higher than the piece above the plane are left out
  (coplanar faces slid across). What moves: `hoverGizmoMove` default **0 — the piece alone** (an offset on its ring place); 1 moves the gizmo.
* **Drawn** — the MODEL is the solved place; ⭐ (§23) the mesh follows it on the PART TRANSLATION'S FOLLOWER — `hoverInertiaMs` 40 ms,
  `hoverDampingRatio` 0.93, `hoverLeadMs` 9.75 ms (slider 0–100 ms) (OBJECT TRANSLATION › PIECE SLIDING), at most 3 mm ahead (`HOVER_OVERSHOOT_M`). The other parts
  sway at 0.1°; the hover's highlights are parented to their host part, so they follow its sway.
* **The camera — the hover view** (§14): the NEAREST of the hosting face's four isometric corners (left/right, above/below — the side the camera
  is already on), reached on an ARC about the piece at the camera's own distance, by the hover drag's travel over `pieceOrbitEnterMm` (12 mm),
  its share eased on the spring; left the same way by the orbit's travel; at its end exactly the rings' camera. ⭐ (§24) at the slide view the
  camera is UPRIGHT — gravity straight down the screen (its up rolled to the world's vertical by the view's weight), so the corner is not exactly isometric. ⚠ It ends only with no hover
  on (§17 — the freeze).
* **Back to the orbit** — the piece-only offset goes back to the ring place by the ORBIT drag's travel over `pieceOrbitEnterMm` (§13), solved
  (8 of the frame's 24 queries kept for it), drawn on the spring (§16). The gizmo never moves on the toggle.
* **Around it** (`RESTING_FACE_ALIGNMENT.md` §30, 2026-10-15): a tap turns the piece (on empty space) or picks its resting face (on the piece)
  ONLY while the quads show (hidden nearer than 65 % of the farthest distance); ⛔ the gizmo's supporting face as the mating face, and its
  yellow, are deleted (§28 superseded). The resting face's contour is GREEN #D8FDD2, shown with the quads or while a slide is available / on.
* **The orbited goals** (`LEVEL_END.md` §5quater): green and turquoise on Piece4's top, flush on its CONTOUR, judged in the WORLD at
  `orbitGoalMm` 5 mm / `orbitGoalDeg` 3°; the green one accepts its long side along Piece4's top (or turned 180°), wide base down.

**Open — what the next conversation should know**
1. ⛔ **No device close.** Last reports fixed (2026-10-15): the edge margin, the desktop jitter, a one-axis step held short of the edge (§18), the
   orbit's tunnel through a part (`COLLISION.md` §12nonies). ⚠ The iPhone's mobile reports of 2026-10-15 were made on a STALE build (`3a94915`,
   before §17's freeze fix) — to re-test with the HUD's `build` = the live id.
2. ⚠ **The red yellow while a turn still works** (explained, not changed): the red check sweeps the turn a tap on EMPTY space would make, from
   the CURRENT resting face, finely; a tap on the piece makes another turn, unchecked; and the PLAYED turn (`restAlignFrame`, ~8 steps over
   125 ms, held only when a step gets closer than it is) can pass through a thin corner the check catches — a real weak spot, offered as a fix
   (make the played turn follow the check), not asked yet.
3. ⚠ **"The green highlight is well inside the hosting face"** (the owner's attachment, 2026-10-14) — not explained: at that moment the HUD said
   no part faced the piece, so no green should have been drawn; a front-on screenshot was asked for (a stale highlight is possible).
4. ⚠ **"I cannot snap the goal of the green piece on Piece4's top"** — explained, not a defect: the piece stood 90° off (its long side across
   the top); one more roll on the yellow, then hover to the centre (it overhangs the 30 mm top by design, the piece being 45 mm deep).
5. ⏸ **The floor as a host** — parked with two ways forward (gizmo support + unlimited distance, or seat placeholders on the floor) → §11.
6. ⚠ Headless testing: a synthesised MOUSE drag never reaches the hover (touch does) — staging scripts live in the session scratchpad only.
7. ⚠ The hover is not an episode yet (`SCORE.md`).


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
  drag** (*"Cleared on orbit"*) — ⭐ by its travel, the way in's (§13).

## 4. The camera — the hover view, in and out by the finger's travel

> ⛔ The view's DIRECTION and DISTANCE below are superseded by §12 (isometric, the boot distance at the zoom of the moment).

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

## 12. The defaults, the isometric hover view, the green (2026-10-14, `1.0.76-`)

> ⛔ The hover view's DIRECTION, its DISTANCE and the straight blend below are superseded by §14 (the nearest isometric corner, on an arc).

> *"Set default gizmo moves with hover off and hover distance is unlimited"* · *"modify the offset and distance of the camera during hover so
> that it's view direction projects equally to the three orthogonal planes horizontal, gravity and the third orthogonal and the cyan
> highlight can be viewed from top right towards bottom left. Distance of camera to object equals the distance of camera to object at boot
> with same zoom."* · *"change the cyan highlight color to this green color as attached"* — the owner. ⛔ Unjudged by a hand.

* ⭐ **Defaults**: `hoverGizmoMove` **0** (the piece alone moves; the gizmo stays) and `hoverAmplitudeMm` **500** (unlimited). Headless: the
  piece slid ~20 cm along a face and stopped 1.00 mm from the next part.
* ⭐⭐⭐ **THE HOVER VIEW IS ISOMETRIC** (`hoverIsoDirection`): the camera looks along a direction with three EQUAL components — on the
  horizontal plane, the vertical (gravity) plane of the hosting face, and the third orthogonal to both: `(up + a + b)/√3`, 35.26° above the
  horizontal. It sits ABOVE and to the RIGHT of the face, looking down-left at it. A side face: `a` its normal laid flat, `b` toward the
  screen's right. A top face: `a` the screen's right laid flat, `b` toward where the camera already is. ⛔ The face-on view turned by the
  CAMERA OFFSET's angles (and its pitch fix of §9) is deleted (`hoverCameraPosition`, `pitchAxis`).
* ⭐⭐ **THE DISTANCE** (`hoverViewDistanceM`): the camera's distance to the piece AT BOOT, had the zoom been the current one — the boot's
  orbit pose, the piece's place on the rings and the angle offsets recorded at the first frame (`st.bootCamGeom`), the camera put behind the
  piece by the gap the zoom makes now. So the ZOOM works in the hover view (§10's HUD note now only shows the view's share). Headless: 1.263 m,
  the boot's at zoom 1.
* ⭐ **THE GREEN**: the ready contour, the contact shadow and the hosting face's fill are **#D8FDD2** (216, 253, 210), sampled from the owner's
  swatch — they were cyan.

## 13. After a hover, the orbit WAYS IN (2026-10-14, `1.0.76-`)

> *"After a hover which has moved the piece and release of the press, the next press toggles to orbit and the piece jumps to a previous
> position"* → *"After a hover which has moved the piece, the orbit shall way in smoothly (same as the previous way in way out of the piece
> orbit) so the piece does not jump. The gizmo position shall not be changed by a toggle from hover to orbit."* — the owner. ⛔ Unjudged by a hand.

* ⛔ **The jump**: the piece-only hover offset (`hoverGizmoMove` 0, the default) was dropped by the next orbit drag (*"Cleared on orbit"*, §3)
  over ~0.1 s whatever the finger did (τ = `boxSmoothMs` / 2) — read as a jump back to where the piece was before the hover.
* ⭐⭐⭐ **THE WAY IN** (`HoverWayIn`, `hoverWayInLeft`): the offset goes back to the piece's ring place by the orbit drag's FINGER TRAVEL,
  exactly as the way in round a piece — the travel read on the orbit's spring (`smoothTravel`), the share left
  `1 − smoothstep(travel / pieceOrbitEnterMm)` (**12 mm**, `entryProgress`'s curve); no finger travel, no move. SOLVED as before (a part in
  the way holds the piece until the travel opens it), inside the frame's query budget.
* ⭐ **The gizmo is not touched** by the toggle: the orbit step only adds its travel (a vector checks it writes no centre).
* Headless: a 512 mm hover offset went back over the first 12 mm of orbit travel, eased (start and end slow), the gizmo still.
* ⚠ Not addressed here (the owner's second report, to be reworked): the hover drag's own mapping can still carry the piece far from the
  finger (120 px moved it ~0.5 m headless, the camera swinging meanwhile).

## 14. The hover view: the NEAREST isometric corner, on an arc from the rings and back; each finger step from the camera of the moment (2026-10-14, `1.0.76-`)

> *"I am not satisfied with the camera movements when toggling back and forth between hover and orbit. There is too much mismatch between the
> camera position in hover and the rings and as a consequence when toggling into hover the piece flies away from the press and when toggling
> into orbit the camera has a very complex move. Disregard the requirement of camera placement during hover. I want to implement a camera
> position during hover which provides a good isometric view of the piece and sliding surface with minimum movement from the orbit ring
> (therefore during hover the camera can be on the left or the right of the piece, on the bottom or on the top of the piece) and also which can
> simply smoothly easily blend back into orbit rings."* → the proposal → *"Build"* — the owner. ⛔ Unjudged by a hand.

* ⭐⭐⭐ **THE NEAREST ISOMETRIC CORNER** (`hoverCornerDirection`): in the hosting face's frame — its normal `n`, `t1` the screen's right laid
  on it, `t2 = n × t1` — the four isometric views `(n ± t1 ± t2)/√3` see the face at 35° and both its axes alike; the hover takes the one on
  the side the camera ALREADY is (the signs of the camera's direction along `t1`, `t2`): the nearest of the four — left or right, above or
  below (toward or away on a top face). Square on an axis (within 0.02), the side chosen before is kept. ⛔ §12's fixed above-right view at the
  boot's distance is deleted (`hoverIsoDirection`, `hoverViewDistanceM`, the boot pose it read).
* ⭐⭐⭐ **ON AN ARC, ITS DISTANCE KEPT** (`hoverCameraSwing`): the camera turns about the hover's target (the resting face's centre at the
  start) from where the rings' camera is toward the corner — a great-circle turn (`slerpDir`), the distance to the target unchanged (no zoom
  jump), the look slid from the gizmo to the target by the same share. ⛔ The position was blended along a straight line toward a view at
  another distance.
* ⭐⭐ **BACK ONTO THE RINGS, SIMPLY**: the orbit holds still under a hover (§10), so the rings' camera is where it was; the same arc runs back
  as the orbit drag travels, and at its end the camera IS the rings' camera. In and out by the way in's own travel, `pieceOrbitEnterMm`
  (12 mm) — the `hoverCameraGain` slider is deleted.
* ⭐⭐ **EACH FINGER STEP FROM THE CAMERA OF THE MOMENT** (`rayPlaneCoords`, `hoverFingerStep`): the rays through where the finger was and
  where it is, both cast from the camera as it is, meet the hover's plane — the distance between the two points (× `hoverGain`) is the step,
  exact under the finger. So only the FINGER moves the piece; a camera turning under a resting finger moves nothing. ⛔ The screen step was
  solved onto the plane's screen SHADOWS (a linearisation a foreshortened axis multiplied). ⛔ A first build kept the piece at the point
  ABSOLUTELY under the finger: the camera's turn then swept that point — and the piece — 0.23 m across the plane, headless; deleted the same
  hour. A ray grazing the plane (under 12°: a face seen nearly edge-on) moves nothing — the camera still turns toward the corner, which sees
  the face at 35°, and the drag takes over.
* Headless (a staged camera from BELOW the floor, the worst case): the camera took the arc (≤ 10 cm a frame at 1 m for a very large turn); the
  piece followed the finger's distance on the plane; the next orbit took the piece back smoothly. ⚠ On a device the turn is expected far
  smaller (20–50° from a ring).

## 15. The latch from a dy collision, the outline of the coplanar faces, back to the orbit off the faces (2026-10-14, `1.0.76-`)

> *"Most of the times, I achieve collision with the dy input of the orbit by reaching close to the gizmo with resting face and hosting faces
> aligned … the green highlight for hover latch does not appear and I need to input a slight dx orbit to latch the hover. Why is that?"* ·
> *"Display also a green highlight over the biggest boundary of coplanar hosting faces so the user can visually couple it with the green
> highlight of the resting face"* · *"when there is not any portion of the resting face in contact with a hosting face … the movement shall
> default back to orbit even if the press has not been released."* — the owner. ⛔ Unjudged by a hand.

* ⛔⛔⛔ **WHY THE DX WAS NEEDED**: the latch (the ready look and `hoverStart`, `hoverFaceContact`) required the resting face's CENTRE over the
  hosting face (§10, item 5). The orbit keeps that centre ON THE RING, at least the ring's least radius from the gizmo: at a dy collision near
  the gizmo on a narrow face the centre stood past the face's edge while much of the resting face lay over it — only a dx, swinging the centre
  over the face, latched. ✅ **ANY PORTION** of the resting face over the face latches (`overlapsTriangles`: the resting face's outline and the
  face's coloured triangles, laid on the plane, overlap by more than 0.1 mm — separating axes, `convexOverlap2D`); touching an edge is none.
* ⭐⭐ **THE OUTLINE OF THE COPLANAR HOSTING FACES** (`rectUnionOutline`, `buildCoplanarOutline`): every part's face in the hosting face's plane
  (0.5 mm), each by its extent on the plane's axes (the world's for a face square to them — every `Scene_1` part), grown 1.6 mm so the 3 mm
  joints between coloured cores close, the ones joined to the hosting face, their UNION's boundary drawn GREEN (#D8FDD2) on the coloured faces —
  with the ready look and during the hover, beside the hosting face's faint fill.
* ⛔ (superseded by §16: the hover is BOUNDED by the faces instead) **OFF THE FACES, BACK TO THE ORBIT**: after each hover solve, the resting face's outline at its solved place over NONE of the coplanar
  faces' triangles (gathered at the hover's start) ends the hover — the finger still down, its next move ORBITS; the piece keeps its offset,
  taken back by the orbit's way in (§13). Headless: a long drag left the faces and the same finger orbited on, ≥ 1.04 mm from every part.

## 16. The hover bounded by the hosting faces; a smooth draw and a smooth way back (2026-10-14, `1.0.76-`)

> *"modify: when there is not any portion of the resting face in contact with a hosting face … the hover translation shall stop and be bounded by
> the hosting face contour and the user shall be able to bring back the hovering piece inside the boundary by reversing the delta position
> input. No more automatic transition to orbit."* · *"When the piece hovers in desktop, the slide is not smooth but jittery. Also, when toggling
> back to orbit, the initial movement of the piece is jittery (while it is still close to the hosting face) and comes back very smooth when the
> piece is far from the hosting face in orbit."* — the owner. ⛔ Unjudged by a hand.

* ⭐⭐⭐ **BOUNDED** (`boundStep`): before each solve the hover's target is held where some portion of the resting face stays over a coplanar
  hosting face — the whole step if it does; else the step along ONE axis that does (sliding along the boundary); else as far as the step goes
  (12 halvings). The finger's excess is dropped, so reversing brings the piece back at once; a slide that carried it off is held where it was.
  At the edge the HUD says *"at the edge of the hosting faces — reverse to come back"*. ⛔ §15's switch to the orbit is deleted. Headless: a drag
  outward from a face's edge held the piece there; the same drag inward slid it 10 cm, ≥ 1.00 mm from every part.
* ⭐⭐ **THE DRAW ON THE ORBIT'S SPRING**: the drawn piece eases after the solved one critically damped at the orbit's τ (`boxSmoothMs` / 2), no
  lead. ⛔ The part translation's follower (τ 7.6 ms, ζ 0.2, a phantom lead) passed the solve's per-frame steps straight through — a mouse's
  events beat against the frames (125 Hz against 143 fps on the owner's HUD): frame steps varied by more than half their mean (vectored), and
  the overshoot `hoverDrawLag` clipped stuck and slipped. Now steady (under 15 %), never ahead of the solved place.
* ⭐⭐ **THE WAY BACK, SMOOTH NEAR THE FACE**: the way in's offset is drawn on the same spring (`wayInDrawFrame`, the difference on the mesh
  only), and keeps 8 of the frame's 24 gap queries (`HOVER_FADE_QUERIES`) — ⛔ near the hosting face the orbit's slide took them all and the
  way in advanced in bursts, each one shown. The hover view's share eases on the spring too (it stepped at each pointer event), and the view
  ends once its SHOWN share is back to 0 (it was dropped at once).

## 17. The regression: the hover froze (2026-10-14, `1.0.76-`)

> *"regression: I cannot grab any longer the piece to hover when the green highlight appears. the scene freezes."* — the owner.

* ⛔⛔⛔ **THE CAUSE** (§16's eased hover view): a NEW hover view starts with both shares at 0, and the view was ended as soon as both were 0 —
  the very next frame, before the drag raised it. So the camera never turned toward the corner. With a face seen nearly edge-on — the usual
  case after a dy collision, the camera level with a top face — the finger's ray grazes the plane and moves nothing *while waiting for that
  turn* (§14): nothing moved at all. Headless the view was `null` during a drag (measured), `1` once fixed.
* ✅ **The view ends only with NO hover on** (`hoverViewEnds`): its asked share back to 0 AND its shown share back to 0.
* ⭐ And a hover that STARTS outside the faces' bound (§16) is not held by it — free until it is inside (`boundStep`): it could never move.
* ⚠ A synthesised MOUSE drag does not reach the hover headless (the same before and after), so the freeze was found by reading the code, then
  measured with touch.

## 18. The edge margin; the desktop jitter; a one-axis step held short of the edge (2026-10-15, `1.0.76-`)

> *"currently if any portion of the resting face contacts with the hosting face, the contact is on … Make a margin of a couple of mm so that the
> piece slides within a margin of the boundary, not up to the edge to edge limit."* · *"in desktop mode, the sliding movement is jittery. It is ok
> in mobile mode."* · *"attachments 1, 2 & 3: the sliding is not working in these configurations in mobile mode, and the camera does not move to its
> sliding position"* — the owner. ⛔ Unjudged by a hand.

* ⛔⛔ (DELETED the same day, §19: the CENTRE bound, the slider removed) ⭐⭐⭐ **THE EDGE MARGIN** (`hoverEdgeMarginMm`, 2 mm, a slider — ⭐ (2026-10-15, *"Make a slider for the margin of the resting face on boundary inside the object translation menu"*) moved to the top-level OBJECT TRANSLATION section as *resting face margin on the boundary*; it was under *hover reach* in TRANSLATION IN WORLDSPACE › OBJECT TRANSLATION): the resting face must overlap the hosting faces by at least
  the margin ACROSS (`overlapsTriangles`' `marginM`, the separating-axis overlap) — for the latch (`hoverFaceContact`, the readiness look) and the
  bound (`boundStep`'s `inside`). So the slide stops the margin short of the edge-to-edge limit. ⚠ Read as *"at least 2 mm must still overlap"*;
  the other reading (*the whole resting face 2 mm inside the boundary*) was named to the owner, not built.
* ⭐⭐⭐ **THE DESKTOP JITTER** (`hoverDrawLag`): the drawn lag is kept WHOLE while it is behind; only its part AHEAD along the last step is dropped.
  ⛔ It was projected onto the last step's direction and its part ACROSS dropped — a mouse's integer-pixel steps through the per-axis band
  alternate axis from frame to frame (125 Hz against 143 fps), so the drawn piece swung across on every switch: 5.6 mm a frame against a 0.7 mm
  step in the vector (now under 15 % of a step). A finger's steps do not alternate: mobile was smooth.
* ⭐⭐ **A ONE-AXIS STEP AT THE EDGE** (`boundStep`): ⛔ a step along one axis found its "slide along the other axis" inside (it is `from`) and
  stopped where it stood, short of the edge — common, the deadband's corridor making one-axis steps; now the halving takes it up to the edge.
* ⚠ **The mobile reports** (no slide, no hover view, in three configurations) came from an iPhone on `3a94915` — before §17's fix of exactly that
  (the camera never turned, a grazing finger moved nothing). Not re-tested yet.

## 19. The centre bound — the drawn boundary; the edge margin deleted (2026-10-15, `1.0.76-`)

> *"Remove the slider resting face margin on the boundary and make change the logic for the boundary: the center of the resting face shall remain
> within the boundary."* → *"No bridging. The boundary is drawn when sliding is allowed. Clamp the sliding so that the center of the resting face
> remains within the boundary."* — the owner. ⛔ Unjudged by a hand (a slide to the edge not driven, headless or on the glass).

* ⭐⭐⭐ **THE BOUNDARY IS THE ONE DRAWN**: the green outline of the coplanar faces joined to the hosting face (`coplanarBoundary` in
  `hover_wiring.ts`, kept at the hover's start in `st.hover.bound`): their extents on the plane's axes, grown by the outline's own `OUTLINE_GROW_M`
  (1.6 mm — the drawing's join of cores 3 mm apart, nothing added for the clamp), the ones joined to the host (`rectComponent`). The outline is drawn
  from THOSE rectangles (`rectsBoundary`) — one source for the drawing and the clamp (`rectUnionOutline` deleted).
* ⭐⭐⭐ **THE CLAMP** (`insideRects`, through `boundStep`): the resting face's CENTRE (the hover's anchor) within the boundary — a slide outward stops
  with it ON the outline, slides along it, reverses at once; a hover starting with the centre outside (the latch is any portion, §15) is free until
  it is inside (§17).
* ⛔ **DELETED**: §18's edge margin (`hoverEdgeMarginMm`, its slider — briefly moved to the top-level OBJECT TRANSLATION section), and the overlap of the
  resting face's outline as the bound. The latch is any portion again.
* Vectors: `tests/hover.test.ts` (*THE CENTRE BOUND*); they failed against the overlap bound.

## 20. The Fable audit's fixes (2026-10-15, `1.0.77-`)

> *"Do an audit of what we have built since commit bce905c … with Fable agent. Check for soundness of the logic and robustness of the code. Propose
> fixes."* → *"apply all the fixes. for the U-shape, if the cost-benefit of few points checks along the step vs. lightness of code is negative, keep as
> it is"* — the owner. ⛔ Unjudged by a hand.

* ⛔⛔⛔ **HIGH — THE FREEZE §19 BROUGHT** (`holdOffBound`): a hover starting with the resting face's centre OUTSIDE the boundary (the latch is any
  portion, §15 — the dy collision near the gizmo) was put back at its start after every solve: `boundStep` let it go, the post-solve check
  (`if (!inside(solved))`) held it. Reproduced by the audit (0 of 40 frames moved). Now held only when the step went from inside to outside.
* ⭐⭐ **THE FRAME'S QUERIES**: the hover's solve counts in `st.pieceSolveQueries` — ⛔ under a hover it read 0, and the quads' turn check (later in the
  frame) spent the 24 again: ~48 a frame, ten times a second.
* ⭐⭐ **THE VIEW RETARGETS ON THE START POINT TOO** (`hoverViewRetargets`, `HOVER_RETARGET_M` 5 mm): ⛔ a second hover on a face of the same normal
  kept the first hover's target.
* ⭐ **THE WAY BACK HELD BY A PART** is not solved again until the finger's travel moves on (`wayInDue`, `HoverWayIn.heldAtMm`) — ⛔ every idle frame.
* ⭐ **THE RESTING CONTOUR** reads this frame's readiness (`hoverVisualFrame` before `restingFillFrame`) — ⛔ a frame late.
* ⭐ **HYGIENE**: the unread fields deleted (`st.hover.partId`, `centre0`, `offset0`; `hoverFollow.vu/vv/lu/lv`).
* ⏸ **KEPT, the owner's call**: on a U-shaped boundary one fast step may jump the void of the U (`boundStep` reads a step's end) — *"I do not mind if
  the piece can jump the U-shape as this is also the case in reality"*; a check of points along every step would cost code and queries for it.
* ⚠ Noted, unchanged: an edge of a tilted resting face (within the 2° latch) could dip under the "behind" tolerance (the quads align exactly — not
  reproducible); the drawn outline and the clamp's boundary can name different faces for ≤ 100 ms of world change before the press.

## 21. A rapid drag cannot throw the piece off the boundary; a face hosts only a resting face in front of it (2026-10-15, `1.0.78-`)

> *"a rapid delta position can throw the piece outside the boundary and when the orbit restart, the piece is not reachable any longer and does not
> follow the orbit."* · *"the green piece approaches from underneath, arrives in sliding position with the resting face facing the bottom while the
> hosting face is also facing the bottom because the slanted face allows the resting face to be close enough to the hosting face. as a result, the
> sliding is odd"* — the owner. ⛔ Unjudged by a hand (a synthesised drag does not reach the hover headless: vectored only).

* ⛔⛔⛔ **FREE WHILE OUTSIDE** (§17's fix, kept by §20): a hover starting with the centre OUTSIDE the boundary (the latch is any portion, §15) let
  every step through — one fast drag AWAY threw the piece as far as the finger went (the amplitude is unlimited), out of reach; the way back is a
  straight line a part can block. ✅ ONE RULE: a step may never take the centre FARTHER from the drawn boundary (`rectsDistance`, 0 inside) —
  `boundStep` for the aim, `holdOffBound` for the solver's slide. Inside it cannot leave; outside it moves toward the boundary or along it.
* ⛔⛔ **A FACE THE RESTING FACE WAS BEHIND** (`hoverFaceContact`): the resting face's centre was allowed the whole reach (20 mm) on EITHER side of a
  face's plane — the slanted green piece, tucked under or beside a part, latched onto a face it was behind; the hover ran on that plane and the parts
  "behind" it (the host among them) were exempt from its checks. ✅ `HOVER_BEHIND_M` (1 mm, contact rounding): a face hosts only a resting face IN
  FRONT of it.
* Vectors: `tests/hover.test.ts` (*a rapid drag cannot throw the piece off the boundary*, *a face hosts only a resting face IN FRONT of it*).

## 22. ⛔ REVERTED the same day — the gizmo following the resting face's centre (2026-10-15, `1.0.78-`)

> *"when the piece slides on the coplanar surface, the gizmo lerp into the projection of the center of the resting face onto the coplanar surface and
> then follows the sliding of the center of the resting face …"* → built (`488d066`, deployed `e0231bd`) → *"revert to commit 51bf7e9. I did not like
> the gizmo to move"* — the owner.

* ⛔ **REVERTED** (`8431214`, live `ad376a5`): the hover is as §21 left it — the piece alone moves (a piece-only offset on its ring place, the
  `hoverGizmoMove` slider back at 0), the gizmo stays where it was; the next orbit ways the piece back to its ring (§13).
* Kept as the record of what was tried: the gizmo eased onto the solved centre's projection on the hosting plane (the drawn piece's spring) and
  stayed there after the lift; the piece's offset was kept against the gizmo of the moment (ring base + offset = where the slide put it); the next
  orbit drag eased the piece OUT to its ring about the new gizmo (264 mm → 0 in the headless run). ⚠ The owner's U-shape question was answered then:
  the hosting face is the face the resting face looks at, so a gizmo over a void would not have broken the latch.

## 23. The slide stops at the lift, a press on the piece sets it up again; the highlights follow the sway; the slide's inertia (2026-10-16, `1.0.78-`)

> *"After a slide, when the press is released, the slide and highlights shall immediately stop. The next press then drives the orbit … Make sure the
> highlights follow the parts when they sway … Add some inertia when sliding the green – turquoise piece. Propose to reapply what we did for translation
> of a part in world translation."* → *"build the inertia. place the sliders in object translation under subfolder piece sliding"* → *"if the next press
> is on the piece itself, the sliding setup toggles back on (highlights, sliding mode, etc.)"* — the owner.

* **The stop** — the lift ends the hover AND its drawn follower (`hoverFollow`, `hoverDraw` dropped: the piece is drawn where it stands, no ease
  left to play); `st.hoverSlid` is set, and while it is, no slide is offered (`hoverOffered`): the readiness and its highlights go off at once, a
  drag elsewhere orbits (the way back of §13 then runs on its travel and clears the flag). ⭐ A press ON THE PIECE clears it and invalidates the
  readiness (`hoverPressNote`), so the latch is looked for on that press and the drag slides again. A new piece (`spawnOrbitPiece`) starts clear.
  Before: the drawn piece kept easing after the lift, so the orbit's first steps slid it on before it turned.
* **The highlights follow the sway** — the contact shadow, the face fill and the coplanar outline are built in the HOST part's model frame
  (`hostFrame`) and PARENTED to its mesh: the sway (drawn only) carries them; the model frame is the drawn one at rest, so nothing moves without it.
* **The inertia** — the part translation's follower (`advanceFollow` toward `phantomTarget`, the velocity by `exponentialSmooth`) on the drawn
  piece's two plane coordinates; the model stays the solved place (the collision and the boundary exact). The drawn piece may run AHEAD of it by
  3 mm at most (`hoverDrawLag`'s cap) — the overshoot; behind, it is free. ⚠ The part translation's own values (7.6 ms, 0.2) were measured
  headlessly to let a 42 mm frame step through (jerky); 60 ms / 0.5 gave a largest step of 11.8 mm and a 2.6 mm overshoot. Sliders: OBJECT
  TRANSLATION › PIECE SLIDING (inertia 1–100 ms, damping 0.1–1, lead 0–5 ms).
* ⭐ **The owner's defaults** (2026-10-16: *"set default slide inertia = 40 ms, slide damping ratio = 0.93, slide phantom lead raise the slider"*):
  **40 ms / 0.93** (nearly critical: a trace of overshoot); the lead stays 0.2 ms, its slider now **0–100 ms** (step 0.5) — the spring trails the
  solved place by about its own lag, and a lead of that order (tens of ms) cancels it; the 3 mm cap still bounds what runs ahead.
* Checked headlessly (touch): the lift stops the ease and the highlights; a drag elsewhere orbits; a press on the piece re-arms (Piece32, the
  outline back) and its drag slides. ⚠ The desktop mouse cannot be staged (§0, open 6); ⛔ no device close.
* ⭐⭐ **The kinetic friction** (2026-10-16, the owner: *"can you also add some friction ? (different from inertia)"* → *"Kinetic (drag)"*, chosen over
  a static stick and a speed-growing roughness): each finger step on the plane is scaled by `speed / (speed + hoverFrictionMmS)`
  (`hoverFrictionScale`, the finger's glass speed smoothed over 50 ms, decaying when it rests) — a slow move is held back most, a fast one nearly
  1:1, never stuck. The finger keeps its own place (its rays stay exact), so the piece falls behind a slow finger: it is under the finger only
  with the friction at 0. Default **10 mm/s** (a guess: half the travel at 10 mm/s), slider 0–100 in PIECE SLIDING. ⚠ The headless drag is fast
  (284 vs 288 mm of offset, off and on, both stopped by the boundary): the slow-finger effect is for a hand to judge.
* ⛔⛔ **The spent slide re-armed by the orbit** (2026-10-16, the owner: *"It is not working: if I release the press on sliding, the sliding stay. If I
  press on empty afterwards, the sliding stays"*): the orbit's first step cleared `hoverSlid`, and the piece, still against the face, re-latched at
  once — headless, the green outline was back 3 frames into the drag on empty space. ✅ Now `hoverSlidAfterLook`: the slide stays spent while a look
  still finds a contact, and clears once the piece is out of every contact (18–23 mm into the orbit, headless — the outline stayed off the whole
  drag); a press on the piece clears it at once. ⚠ Touch staged only — a stay right at a MOUSE up would be another fault.
* ⭐ **The owner's lead and friction** (2026-10-16: *"set the slide phantom lead to 9.75 ms and slide friction to 12.5 mm/s"*): `hoverLeadMs` **9.75**,
  `hoverFrictionMmS` **12.5**; their sliders' steps made finer (0.25 ms, 0.5 mm/s) so the defaults sit on them.
* ⭐ (2026-10-16, the owner: *"set the slide friction to 8 mm/s"*) `hoverFrictionMmS` **8** (12.5 before).

## 24. The slide view upright — gravity down the screen (2026-10-16, `1.0.79-`)

> *"modify that to account another constraint: at the camera end position for sliding mode, gravity direction is aligned with vertical axis of the
> screen. Therefore, the target isometric view relative to the hosting face will not be exactly isometric. But this is necessary so that the user feels
> the gravity is always aligned with the screen vertical axis."* — the owner.

* ⛔ **Why**: the camera's up came from the orbit (`DOUBLE_ORBIT_PROTOTYPE.md`, the camera derived from the piece) — on a turned rig the slide happens
  near rings 2 and 3, where that up is partway through the swing's half turn: at the slide view gravity could stand at an angle on the screen.
* ⭐⭐⭐ **`uprightBlend`** (`input/hover.ts`): as the camera arcs into the slide view, its up rolls about the view toward the world's vertical by the
  view's weight (`hoverCameraBlend` now gives it, the 12 mm of the slide's travel) — none at 0 (the orbit's), EXACTLY upright at 1; back by the orbit's
  travel. The direction stays the nearest isometric corner `(n ± t1 ± t2)/√3` — upright, the face's two axes no longer read alike on the screen.
* Headless (touch, Piece18's side face): at the slide view (shown 1) the up in the view's vertical plane — roll 0 — the view 35.3° down. ⚠ A top face's
  slide view (also 35° down) not staged. ⛔ No device close. 2046 vectors.
* ⛔⛔ (2026-10-17, `1.0.79-`) the way back after a slide blocked when it started in CONTACT (the solver refused a singular metric before asking whether the step pushed in) and crawling over flush tops — fixed in the solver → `COLLISION.md` §12undecies.
* ⭐⭐⭐ (2026-10-17, `1.0.80-`) between rings 2 and 3 the orbit's camera already holds the SLIDE VIEW (the nearest isometric corner, upright, on the piece) — a slide should start without a camera move → `DOUBLE_ORBIT_PROTOTYPE.md` (2026-10-17).
* ⭐ (2026-10-17, `1.0.80-`) the slide view now LATCHED all along the orbit's curve with the gizmo on a face, kept in front of the face → `DOUBLE_ORBIT_PROTOTYPE.md` (2026-10-17).
* ⭐⭐ (2026-10-17, `1.0.80-`) the latched slide view replaced: the orbit's camera always on the gizmo, rings 2 and 3 at the slide view's tilt (±r·√2) and the angle held between them → `DOUBLE_ORBIT_PROTOTYPE.md` (2026-10-17).
* ⭐ (2026-10-17, `1.0.80-`) the semi-isometric hold between rings 2 and 3 only beyond a cone (45°) of the face's normal; the stray roll on right / back / bottom faces removed → `DOUBLE_ORBIT_PROTOTYPE.md` (2026-10-17).
* ⭐ (2026-10-17, `1.0.80-`) the semi-isometric hold on the PIECE'S side of the face, faded at rings 2–3 and edge-on; the cone two-sided — a face approached from behind no longer jumps → `DOUBLE_ORBIT_PROTOTYPE.md` (2026-10-17).
* ⭐ (2026-10-17, `1.0.80-`) a gizmo change from a top face to a vertical face no longer rolls the camera round (the swing's heading near the vertical everywhere, faded past rings 2–3) → `DOUBLE_ORBIT_PROTOTYPE.md` (2026-10-17).
