# THE ORBIT ON CHARTS — one layout rule for any simple shape (2026-11-15, branch `1.0.145-`)

> ✅ **APPROVED by the owner, 2026-11-15** — *"This is good. Charts approved. Commit. Proceed with execution."* — after the sections were shown on
> 14 of the shapes (the artifact *Orbit Chart Sections*, https://claude.ai/artifact/BkQd1Ffrx6QLsdcsRUKYxn). ⛔ NOTHING BUILT IN `src` YET. Step 0's
> deliverable: the rules, the model, an offline prototype that reads zero on 35 shapes, the build's steps and gates.
>
> The owner (2026-11-15): *"I want to implement your systematic approach"* → *"Don't forget the management of the calm in the specifications as this is
> key for user to see properly the faces extremities"* → the order of the rules (§1): *"ok"* → the calm's two changes (§5): *"Agree with your two
> recommendations"* → the working mode (§7.1): *"agents here"*, *"ok"*.
>
> ⚠ **SCOPE** (the owner): *"consider simple geometries without any singularities (no protrusion, no channel, no hole, etc.)"* — what the "surface" of
> an assembly is (the coplanar faces the gizmo runs on) is PARKED. Everything here is stated and measured on simple convex shapes.

## 0. START HERE — a session that builds a step

1. Read §1 – §4 and the step's row in §7; open the prototype, [`chart_lib.ts`](../../../scripts/probes/chart_lib.ts) — it is the reference: a port
   must give its numbers (`buildChart`, `target`, `anglesOf`, `assignCharts`, the 35 `SHAPES`). Its runner prints the tables of §6:
   `npx vite-node scripts/probes/chart_study.ts`, about a minute (`ONLY=text`, `VERBOSE=1`).
2. What stays: the gizmo a function of the orbit's angles, the faces contour, one rotation between the orbit and the world, the hold ended by the
   finger and by the gesture, the heading held at the zenith, the 24 gap queries a frame.
3. What a step never does: change a behaviour its row does not name; add a threshold without a slider; put a rule in `src/render`.

## 1. THE RULES, in the order they yield

| # | rule | |
|---|---|---|
| 1 | **Landing** — the gizmo is where the piece lands, at the crossing of the green and the red | never yields |
| 2 | **Continuity** — no jump of the gizmo, the piece or the camera | never yields |
| 3 | **Upright** — the camera never upside down | never yields |
| 4 | **Finger** — on the face under the gizmo, dx moves it along the green and dy along the red; the gizmo goes the finger's way | then this |
| 5 | **Sections** — the green and the red straight on that face, square to each other, each a plane cut on the surface | then this |
| 6 | **Level view** — the screen's vertical is the world's | pays for 5: a camera turn at a crossing |
| 7 | **Never blocked** — a moving finger moves the gizmo | pays for 5: a short hold |
| 8 | **Budget** — 24 gap queries a frame; patent-free methods | fixed |

Where no square layout exists the sections' shape yields for good. Three facts belong with the rules — they are not defects:

* **The top and the bottom.** With an upright camera "dy up" means higher, and height ends: upright, never blocked and "dy keeps its way on the
  glass" cannot all hold there. The cube's far edge, the heptagon's ridge and the spit's zenith edge are ONE event: a half turn and a hold (§4).
* **A level face.** Looking straight down every heading is upright: one square layout per entry edge; leaving by another edge costs a camera turn.
* **A fan** (faces meeting at one corner, each a triangle standing on the fan's rim). A line entering by the rim has no opposite edge to leave by:
  rings round the corner and lines into it are the best there is (the owner's sketch 4; Blender's loop cut stops at a pole for the same reason).

⭐ **Why it cannot all hold**: carry a small cross (green, red) round a corner without turning it — it comes back turned by the corner's angle defect;
over a closed shape the defects sum to 720°. Flat faces hold none of it, so the turn is paid on edges (camera turns), at points (poles) or over areas
(a tilted view). A design only chooses WHERE (`POLAR_ZONES.md` §1.4: the same theorem counted on a mesh).

## 2. THE MODEL

### 2.1 A chart

A **chart** is a FRAME (its axis: the layout's vertical) and the faces it serves; the gizmo is a function of the chart's two angles (round the axis,
along it). Built today, three of them: gravity's polar orbit, the tilted pole (`orbit_tilt.ts`), the polar zone (`polar_zone.ts`) — each with its own
detector, trigger, turn and hold (§4.2). This spec gives ONE builder, ONE test per face, ONE assignment and ONE transition.

### 2.2 The COLUMNS chart — today's face map, two rules changed

In the frame of axis `a` (`zoneFrame`'s convention; gravity: the world's own):

* **The pole is the shape's TOP SET and BOTTOM SET along the axis** — a level face (within 1°): a CAP, polar; an edge or a point: the pole itself, no
  cap, the side faces run to ±90°. ⛔ Today (`capOf`): the face nearest the vertical beyond 45°, a ridge only when two tie within 1° — a roof
  sloping less than 45° becomes a cap; under a steeper one (the shed's, 60°) the side band stops at 45° and the place is pinned beyond it; a steep
  apex is pinned for half the pitch range (the audit, 2026-11-14).
* **The columns**: the side faces by heading (faces stacked along a level edge share one heading); each a slice of the yaw from halfway to each
  neighbour's heading — as built.
* **The levels**: the heights of the level edges between stacked faces, and the two ends — as built (F3: one pitch → height scale, the green a ring).
* **The pitch at each level is read from the normals** (step A, §5.2): halfway between the elevations of the two faces meeting along that level edge,
  a cap counting ±90°; several columns with an edge at that level: by the edges' lengths; a pole: ±90°. Repair: a level no pair gives is laid by its
  height between its neighbours, and every interval keeps at least a quarter of its share by the height (two levels never at one pitch). A box: ±45°,
  exactly as built. ⛔ Today: linear in the height between ∓45° or ∓90°.
* **The place**: across the face's CHORD at the height (`chordAt`, F1) by the yaw, up it by the pitch; on a cap, from its rim to its centroid — as built.

### 2.3 What a face is in a chart — the test that replaces the detectors

| kind | when | its sections |
|---|---|---|
| **CELL** | a rectangle whose top and bottom along the axis are level edges | straight and square |
| **FAN** | a triangle standing on a level edge, its apex the chart's pole | rings and lines into the pole, both straight (sketch 4) |
| **BENT** | any other face whose top and bottom are each a level edge or the chart's pole (`Scene_0`'s ends) | the ring straight, the other by the share of the chord (`ORBIT_ANY_SHAPE.md` §2) |
| **CAP** | the level face holding the pole, EVERY column ending on it along a level edge | polar |
| **BROKEN** | it ends on a corner that is not the pole, or it is a cap some column does not reach | the map leaps or stalls there |

The test predicts the measured defects on all 35 shapes (§6): a chart's CELL, FAN, BENT and CAP faces read zero; every leap and stall of today's map
sits on a BROKEN face. A rectangle is a CELL or BROKEN in any frame, another polygon BENT, FAN or BROKEN: the kinds never compete for one face.

### 2.4 The RINGS chart — the last fallback

Level rings (plane cuts square to the axis) and meridian cuts through the SPINE (the bottom set's centre → the top set's centre): the place for
(yaw, pitch) is where the ring at the pitch's height meets the half-plane of that azimuth. Straight on every face, one-to-one on any convex shape,
never blocked; ⛔ not square (a face seen off its heading: measured ≤ 38° on the worst shape, 18° on a dodecahedron). Its levels: every corner's
height, the pitch the mean of the ring's mean elevation just below and just above. Its cap: the same rays on the cap's own outline.

⛔ **Already tried — what differs** (`TILTED_ORBIT_REBUILD_SCOPE.md` §21 – §32 on `1.0.107-Close-in-atlas`; `POLAR_ORBIT_CLEANUP.md` §8.5; the world
meridian red of `ff2fca2`, replaced by Step 4 for a 136 mm slide across a slanted face): those cut the REAL parts, drove the gizmo by the input
along the cut (path-dependent) and applied everywhere. Here the gizmo stays a function of the angles, the cut is of the convex CONTOUR, and it serves
only the faces every COLUMNS chart breaks (none on `Scene_0`, `Scene_0bis`, `Scene_1`).

### 2.5 How a frame is held — as built, named

* **AXIS** — the camera's up is the frame's axis (the tilted pole; an upright zone): the sections horizontal and vertical on the glass, the view
  rolled by the axis's tilt. Its cost on a face: the ROLL.
* **WORLD** — the world's turntable camera (gravity's chart; a spit zone): no roll; the sections turned on the glass by the frame's tilt, the finger
  read in the frame (`fingerInFrame`). Its cost on a face: the sections' turn on the glass, 0 … 45°.
* Which (POLAR_ZONES D-Z6, kept): the axis within 30° of the vertical — AXIS; 60° and more — WORLD; between — the cheaper.

## 3. THE ASSIGNMENT — computed with the face map, at each seat

1. **Gravity's chart serves every face it does not break**, at every distance.
2. **The candidate frames** for the rest: every direction square to two of the contour's edges; for every face, the direction in its plane square to
   each of its edges. A finite list (2 on a cube, 160 on `Scene_0bis`), each a COLUMNS chart with its kinds.
3. **A frame takes**, of the faces gravity breaks:
   * **the fans** — every face round a pole of the frame (a corner), when ALL of them are broken under gravity and are FANS or CELLS in the frame. The
     axis is the direction that lays the fan's rim level: found, not snapped;
   * **the tilted rectangles** — the faces that are CELLS in it at a cost ≤ 45° (`ROLL_OK`), refused where the camera's turn at the frame's border
     exceeds 30° (`SEAM_OK`).
   The frame serving the most area first, then the next, until none serves anything.
   ⚠ **A frame's map is built in the box of the CONTOUR turned into the frame** — ⛔ `tiltBox` (the world box's turned corners, what the wiring hands
   a tilted or zone frame today): looser than the shape in a frame off the parts' axes, the 25 % share test (D5) then drops the first face and every
   one after it — the map all virtual (found at step 1.1 on the heptagon at 45° and the crossed heptagons; no bite on the three scenes' frames).
4. **The whole rule** (D-Z5, kept): a frame whose own faces, with the faces that are CELLS in it at no cost (the same sections as under gravity, or
   a level face), cover more than half the contour serves those too — no change of chart at their borders (`Scene_0bis`: all 21 faces, as built).
5. **What is left: RINGS about gravity** — and a level face the columns cannot hold as a cap takes the rings' cap.
6. **A cap's square layouts** (the tilted pole, generalised): the frames square to it in which it is a CELL — on a rectangle four, one per entry edge
   (today's snapped headings); used on a press and close in (`tiltedPole`, `tiltAutoPct`), as built. Each layout's exits: one with no turn, two with a
   quarter turn, one with a half turn — §9.1's table of `POLAR_ORBIT_CLEANUP.md`, now computed.

**What it replaces:**

| built | here |
|---|---|
| a cap beyond 45°; `RIDGE_TIE_DEG` 1° | the top / bottom set (a face, an edge, a point) |
| `valenceMin` 5, `facetMinRatio` 0.22 (T1, T3), T2 | the face's kind; a fan of 3 or 4 is a fan |
| the zone's axis from the rim's centroid to the pole, `snapDeg` 10° | the frame in which the fan's rim is level — the apex 12.6 or 25 mm off centre gives the same frame |
| `onOrbitPole` 1 mm from the box's centre line | the pole of gravity's chart: its top / bottom set |
| fans on two axes merged into one zone on a meaningless axis | each frame serves its own fans; what none serves goes to RINGS |
| a failing face with no pole stays tilted (D-Z4) | RINGS |
| `uprightMaxDeg` 30, `spitMinDeg` 60, `wholeShare` 0.5 | kept |

## 4. THE SEAMS — one transition for every change of chart

### 4.1 The event

At an edge between two faces served by different charts — or held differently, or across a pole held by an edge:

1. **The gizmo stays at its exact place**; the next chart's angles are read there (`mapAngles`; the prototype's round trip: 0.000 mm on every chart).
2. **The camera turns by the seam's turn, known beforehand**: the angle between the two charts' ups seen along the edge's own view (the two normals'
   mean). WORLD to WORLD: none. At `tiltRollDegS`, the gizmo held meanwhile, committed at the edge — as built (§9.7).
3. **A half turn** (over the top or under the bottom) **sets the dy hold** — as built (`ORBIT_ANY_SHAPE.md` §8 – §8.2).

### 4.2 What it replaces

A change of frame is made today in three places of `assembly_wiring.ts`, each with its own trigger, turn and hold, their order hand-set (a tilt under
way delays a zone switch until its whole roll back is over; a silent side change clears a hold): the tilt, the zone, the spit's side. ⭐ THE INVENTORY
(step 2.1, 2026-11-15): [`ORBIT_STATE_INVENTORY.md`](ORBIT_STATE_INVENTORY.md) — 53 state fields: 20 HISTORY (latches, clocks, last-frame values),
9 cached GEOMETRY, 9 VIEW (eases), 6 TRANSITION, 5 RENDER, 4 other; none is ever reset but at the scene's creation (a pick-up clears four). What the
one transition must keep, from it:

1. **The order is hand-set across two stages of the frame**: the tilt's exit, then the zone's step, then the automatic tilt, then the map's place —
   and the spit's side and the zone's turn later, in the camera's stage; the tilt's roll uses the angle the camera's stage read the frame BEFORE.
2. **Every change of frame repeats one re-base** (`turnAngles`: the orbit, the solved place, the spring, the camera's follow state, the previous
   angles, the calm; then the square camera, `asmShown` cleared, the map's angles re-read at the gizmo by `mapAngles`, a relocation started).
3. **The holds come from four sources**: `tiltClampStep` (the gizmo, through a swing, a roll, a zone's turn), the dy hold (set by the tilt's exit
   and by the spit's crossing), the pending automatic tilt (the camera's swing waits), the mouth's hold.
4. **The mouth and the virtual pole are inside the tilt's trigger** (§4.4), both through `holdsPole` (a side beyond 45°).
5. **Two camera turns, two codes**: the tilt's (`frameMix`, its own share and roll) and the zone's / the spit's (`poseAboutPiece`, ONE shared
   `asmZoneMix` — each can restart the other); a frame's map is keyed by the tilt's or the zone's id (rebuilt at every tilt).

### 4.3 "Never blocked" — its exceptions, stated once

(1) The pole of gravity's polar orbit far out — as today; (2) the gizmo held while the camera turns at a seam; (3) the dy hold after a half turn.
⛔ No other stall: a chart reads zero steps moving nothing on its own faces (§6).

### 4.4 The specificities — holes, voids, channels, mouths, protrusions (the owner, 2026-11-15)

> *"I told you we will look at the contour faces later on. For the moment, we have defined the charts on simple objects. Tell me how you are handling
> the specificities (holes, voids, channels, mouths, protrusions) we have patched in our pipeline for the moment."*

⭐ **The charts read the CONTOUR only** — the facets' polygons — and decide four things on it: the face holding the pole, the columns, the pitch at
each level, the frame serving each face. The contour is convex by construction because the specificities are folded in BELOW it, and they stay there:

| specificity | handled by (unchanged) | the charts |
|---|---|---|
| holes | closed when a facet's stack is built (`filledRegion`) | nothing: a rectangle with a hole is a rectangle on the contour |
| protrusions | a group in front of the facet's main plane, in its stack | nothing: the gizmo on the frontmost group (`stackDepthAt`) |
| voids, channels | the gizmo's depth on the stack: bridged where closed on the travel with no floor, the real depth over a floor, surface where the held piece cannot enter (`pieceEnters`, the rims) | nothing: it runs after the place on the facet |
| the glides of a depth step | the wiring, after the map (`gizmoGlide`) | nothing |
| the edge's slow stretch and its blend | ⛔ OFF since 2026-11-10 (the owner: *"remove it"*; `MAP_OPTS` 0 / 0): `edgeBlend`, `blendThroughEdges` return at once | nothing — dead paths (the inventory's F.1), to delete at step 2.5 |
| **a void's mouth** (open up the facet to its edge) | the gizmo held (`mouthHold`), then handed over BY THE AUTOMATIC TILT | ⛔ **coupled**: the hand-over is a change of frame |

* ⛔ **Step 2.4 must carry the mouth over**: the tilt's trigger becomes the one transition (§4.1), so the mouth's hand-over — and every rule keyed on
  "a face holding a pole" (`holdsPole`: a side facet beyond 45°; the tilt's virtual pole) — becomes a trigger of that transition. Step 2.1's inventory
  lists these paths beside the `asm…` fields, each with the map fields it reads.
* **The gate that they still behave**: `Scene_1` carries grooves, a channel and a mouth — its replay, from step 2.1 on.
* ⛔ **Not measured, and OUT for now — `Scene_2`** (the owner, 2026-11-15: *"Scene 2: I would avoid for the moment: I still need to review the proxy
  faces and the ghost faces so it is not ready for a pass: I will do it myself when I troubleshoot the scene. Focus on the other scene 0, 0bis and
  1."*): no pass, no replay, no walk on it in this build; the charts' kinds on its contour at each seat are the owner's to look at then. A slanted
  part large enough to pass D5 becomes a facet and changes the contour (today too); the charts then treat it as any shape.
* What the "surface" of an assembly is stays PARKED (the owner).

### 4.5 The sway — the orbit reads the MODEL's coordinates (the owner, 2026-11-15)

> *"a point that hurt us in the past: there is a sway of the assembly when orbiting (this will be later replaced by more lively animations): make
> sure that your Opus agent take that into account (in the past we made sure to use the model coordinates, not the swayed assembly coordinates)."*

⛔ **Everything the charts compute is in the MODEL's space** — the parts' model poses (`st.world`), never the meshes as drawn. As built (the
inventory's G): the sway is applied in ONE place, the mesh writer (`render_loop.ts`: sway ∘ follower spring ∘ model pose), before the orbit's frame;
the face maps are built from the model poses (`placedFaces` → `faceWorld`); the orbit's only ray cast is `modelCast` (`swayRay` moves the ray onto
each part as drawn, the hit comes back to its model pose); every gizmo, foot, mouth and relocation point and every map is in model space. So the
contour, the assignment and the rings — functions of the world face map — are in model space BY CONSTRUCTION.
* **The rule for every wiring step**: a point, a normal or a frame taken from a mesh, a pick or the camera goes through `modelCast` / `swayRay`
  before it reaches a chart; stated in every brief, checked in every diff.
* ⚠ **The one orbit input read off the drawn meshes today**: `placedBox` (the meshes' world bounding boxes) → the assembly's centre and radius, read
  at each pick-up — if the assembly sways at that instant the centre is off by the sway. Not the charts'; the owner's to decide (the inventory's F.10).
* The section lines and the zones' tint are drawn at model positions over swayed parts — the rule's own consequence: they part from the faces while
  a sway lasts (F.12).

## 5. THE CALM

The owner: *"a calm is required wherever an orbit over the face would lead to portion(s) of the face being seen by the camera at an acute yaw angle"*.

### 5.1 One rule for every face

The calm's formulas as built (`orbit_calm.ts`: the two readings, the shares 0.25, the zones 25 %, 3 cm) on EVERY side face of the serving chart — a
fan's too; no list of faces with or without. Two changes: the share CONTINUOUS on a narrow run (⛔ `edgeShare` switches to whole below 6 cm — the
120 ms ease hides it), and no fade by the pitch (a pole is a place in the chart, not a pitch). Measured ([`calm_study.ts`](../../../scripts/probes/calm_study.ts),
steady, far and middle orbit): identical on `Scene_1`; the present fan is never seen more than 27° off square with or without it — a steep tip or a
fan of three needs it.

### 5.2 Step A — the pitch scale from the normals (§2.2), with the charts

⭐ The calm halves the badly seen area and never moves the worst slant: it is whole at a border, so a border shows the orbit's own angle — fair only
where the level's pitch is the two faces' bisector. Share of the face seen more than 50° / 65° off square:

| face | calm as built | step A |
|---|---|---|
| `Scene_1`, a side | 4 % / 0 % | 4 / 0 (identical) |
| `Scene_0`, an end face | 18 / 10 | 16 / 4 |
| `Scene_0`, a 13° face | 7 / 0 | 0 / 0 |
| `Scene_0bis` in its frame, a body face | 12 / 0 | 0 / 0 |
| frustum (30°), a side | 28 / 17 | 19 / 3 |

`Scene_0`'s levels: −45 / 3 / 63 / 90° → **−58 / −13 / 38 / 90°**; its end | top-face crossing 81° / 19° → 72° / 19° (45° / 45° is the fairest).
`Scene_0bis`'s frame: −90 / −60 / 60 / 90° → −90 / −31 / 31 / 90°; its rim crossing 61° / 6° → fair. ✅ The owner: `Scene_0`'s mapping may change.

### 5.3 Step B — the view read from the place: a LATER milestone

The view a function of the gizmo's place alone (the normal of the shape with its edges rounded): the only reading that fixes `Scene_0`'s end faces
(0 % / 0 %), smoother (0.41°/mm against 0.96), and a change of chart then never moves the view. ⛔ Not ready: worse than today on a blade and a thin
plate; it moves `Scene_1`'s calm by 4° on average. Its own offline round first (the owner: agreed).

## 6. WHAT THE PROTOTYPE MEASURED

**Against the built map** (the built scale, 260 000 angles each): `Scene_1`'s box 7 × 10⁻¹⁴ mm apart at most; `Scene_0`'s heptagon 8 × 10⁻¹³;
`Scene_0bis` in its zone's frame 2 × 10⁻¹². The prototype IS today's map where today's map is sound.

**On each chart's own faces, all 35 shapes: 0 leaps, 0.00 % of steps moving nothing, each face covered once (0.97 – 1.05), round trip 0.000 mm.**
A leap: a 0.5° step moving the place more than 12 mm. "As built": the world's map alone, every face.

| shape | faces | as built: leaps · stalls · largest | broken under gravity | frames added | on RINGS | off square, worst | on the glass |
|---|---|---|---|---|---|---|---|
| cube (`Scene_1`'s box) | 6 | 0 · 0.0 % · 4 mm | 0 | — | 0 | 0° | 0° |
| heptagon lying, flat ends (`Scene_0`) | 9 | 0 · 0.0 % · 4 mm | 0 | — | 0 | 64° (its ends) | 0° |
| heptagon lying with tips 120 mm (`Scene_0bis`) | 21 | 1192 · 13.2 % · 279 mm | 15 | about x, WORLD × 21 | 0 | 24° | 34° |
| the same, the apex 12.6 mm off centre | 21 | 1184 · 12.9 % · 268 mm | 15 | about x, WORLD × 21 | 0 | 25° | 35° |
| heptagon lying with steep tips 600 mm | 21 | 3812 · 19.0 % · 647 mm | 15 | about x, WORLD × 21 | 0 | 10° | 36° |
| triangle prism lying, flat ends (a steep roof) | 5 | 0 · 8.4 % · 4 mm | 0 | — | 0 | 27° | 0° |
| triangle prism lying with tips (fans of 3) | 9 | 1048 · 19.9 % · 344 mm | 7 | about x, WORLD × 9 | 0 | 57° | 21° |
| square prism lying with tips (fans of 4) | 12 | 0 · 16.5 % · 9 mm | 10 | about x, WORLD × 12 | 0 | 42° | 0° |
| pentagon lying with tips, the apex 25 mm off centre | 15 | 772 · 14.2 % · 268 mm | 11 | about x, WORLD × 15 | 0 | 37° | 42° |
| hexagon prism lying with tips | 18 | 0 · 16.5 % · 5 mm | 14 | about x, WORLD × 18 | 0 | 33° | 24° |
| heptagon with tips, its axis 20° off the horizontal | 21 | 2888 · 39.8 % · 490 mm | 20 | about its axis, WORLD × 21 | 0 | 24° | 42° |
| heptagon with tips, its axis at 45° | 21 | 3230 · 37.3 % · 490 mm | 20 | about its axis, WORLD × 21 | 0 | 24° | 44° |
| heptagon with tips, upright | 21 | 0 · 0.0 % · 5 mm | 0 | — | 0 | 24° | 0° |
| pentagon prism upright, flat caps | 7 | 0 · 0.0 % · 3 mm | 0 | — | 0 | 0° | 0° |
| box with a shallow pyramid roof | 9 | 0 · 0.0 % · 4 mm | 0 | — | 0 | 40° | 0° |
| box with a steep pyramid roof | 9 | 0 · 25.0 % · 5 mm | 0 | — | 0 | 24° | 0° |
| shed (a box under one slanted roof, 60°) | 6 | 0 · 8.4 % · 7 mm | 0 | — | 0 | 30° | 0° |
| house, shallow gable roof | 7 | 0 · 0.0 % · 4 mm | 0 | — | 0 | 64° | 0° |
| house, steep gable roof | 7 | 0 · 8.4 % · 5 mm | 0 | — | 0 | 30° | 0° |
| frustum, sides leaning in 30° | 6 | 0 · 0.0 % · 4 mm | 0 | — | 0 | 27° | 0° |
| frustum upside down | 6 | 0 · 0.0 % · 4 mm | 0 | — | 0 | 27° | 0° |
| triangle prism upright, flat caps | 5 | 0 · 0.0 % · 3 mm | 0 | — | 0 | 0° | 0° |
| wedge upright (a 20° blade) | 5 | 0 · 0.0 % · 3 mm | 0 | — | 0 | 0° | 0° |
| thin plate lying | 6 | 0 · 0.0 % · 4 mm | 0 | — | 0 | 0° | 0° |
| long box | 6 | 0 · 0.0 % · 5 mm | 0 | — | 0 | 0° | 0° |
| cube turned 30° about a level axis | 6 | 1040 · 16.7 % · 483 mm | 0 | — | 0 | 60° (D-C1) | 0° |
| cube on an edge | 6 | 0 · 16.8 % · 5 mm | 0 | — | 0 | 45° (D-C1) | 0° |
| cube on a corner | 6 | 2130 · 41.5 % · 462 mm | 6 | about two of its edges, WORLD × 4, × 2 | 0 | 0° | 45° |
| square antiprism | 10 | 0 · 16.7 % · 5 mm | 10 | — | 10 | 12° | 0° |
| tetrahedron on a face | 4 | 0 · 25.0 % · 3 mm | 0 | — | 0 | 30° | 0° |
| octahedron on a vertex | 8 | 0 · 50.1 % · 4 mm | 0 | — | 0 | 30° | 0° |
| octahedron on a face | 8 | 0 · 16.7 % · 3 mm | 8 | — | 8 | 30° | 0° |
| icosahedron, a vertex up | 20 | 1890 · 27.3 % · 260 mm | 10 | — | 10 | 30° | 0° |
| dodecahedron, a face up | 12 | 3470 · 16.5 % · 207 mm | 12 | — | 12 | 18° | 0° |
| hull of two tipped heptagons crossed | 38 | 2908 · 32.2 % · 281 mm | 38 | — | 38 | 38° | 0° |

**The three scenes — what the player gets:**

* **`Scene_1`**: gravity's chart, 4 cells and 2 caps, levels ±45°; each cap four square layouts, their exits as today. ⭐ Nothing changes: the swap
  (step 2.1) must replay number by number.
* **`Scene_0`**: gravity's chart, 6 cells, the 2 ends bent, the bottom a cap (four layouts); one half-turn seam, the ridge. Two changes: the pitch
  scale (§5.2), and its two top faces are plain cells of gravity's chart — the same sections as their tilt gives today, no tilt on them, the ridge
  crossed with the half turn and the hold as today (D-C4, the owner's look).
* **`Scene_0bis`**: gravity breaks 15 of 21 (the 14 tip faces; the bottom as a cap); the frame about x serves the 14 as fans and, by the whole rule,
  all 21 — the spit, as built; one half-turn seam, the zenith edge; its levels as §5.2.

⚠ **Not covered by the prototype**: the camera's path and its eases, the calm in motion, the wiring, the close-in contact and the square camera, the
solver, shapes that are not convex, a browser, a device. Nothing here is a look.

## 7. THE BUILD — steps, who, gates

### 7.1 The working mode (the owner, 2026-11-15)

Opus 5.5 agents launched from the Fable session build each step, ONE at a time, in a worktree of its own on a new branch (its own `npm ci`, a real
folder); they commit locally — one commit per step, files staged by path, never a push. Fable writes each brief, reads the whole diff and runs the
gates itself: an agent's report is never proof. One `npm run verify` by the agent and one by the auditor per step; walks and headless probes on the
owner's go. A step that changes the screen is closed by the owner's look on a device, nothing else (`CLAUDE.md` rule 5).

### 7.2 The steps

| step | what | closed by |
|---|---|---|
| **1.1** ✅ | built `7cd63a4`, audited (§7.3) — `face_map.ts`: the pole as the top / bottom set and the scale from the normals, behind options whose defaults are today's (`buildFaceMap` unchanged by default; every existing vector untouched) | `npm run verify`; new vectors shown RED on a mutant; a comparison probe: the port against the prototype on the 35 shapes, ≤ 10⁻⁹ m |
| **1.2** ✅ | built `445a194` + `9718ead`, audited (§7.3) — `orbit_charts.ts` (new, engine-free): a face's kind, the candidate frames, the assignment (§3), the whole rule, a cap's layouts, the seam's turn | the same; the assignment equal to the prototype's on the 35 shapes |
| **1.3** ✅ | built `e82262e`, audited (§7.3) — `ring_chart.ts` (new): the RINGS place and its way back | the same |
| **1.4** ✅ | built `c2f3d3a`, audited (§7.3) — `orbit_calm.ts`: the continuous share, the rule for every face — pure, not wired | the same; identical to today on `Scene_1`'s runs |
| **2.1** ✅ | done (§7.3) — the `asm…` inventory (§4.2) and the specificities' paths (§4.4), written down; the replay's BASELINE recorded on today's code for `Scene_1`, `Scene_0`, `Scene_0bis` | the inventory read against the code by the auditor; the baseline replayed twice, identical |
| **2.2** 🔧 | built `9e38e78` + `7463174`, audited, replayed (§7.3); the owner's look: *"everything ok with charts switched on"* (2026-11-15; ⚠ the device not stated) — step A behind a switch, off by default (the map's `layout` "chart" and `scale` "normals", the world's and the frames') (§5.2) | `Scene_1` unchanged; walks; the owner's look on `Scene_0` |
| **2.3** 🔧 | built `fcfa8bd`, audited, replayed (§7.3); ⛔ the owner's look owed — the calm on every face (§5.1) behind a second switch, `chartCalm` (off by default; acts only with `chartLayout` 1) | `Scene_1` unchanged ✅; the owner's look on `Scene_0bis` |
| **2.4** 🔧 | built 2026-11-15 as P, 2.4a, 2.4b, 2.4c, 2.4e (§12, §12.1), each audited, deployed (main `902ae88`), the owner's look 2026-11-16: *"looks on pc and mobile look good"* (§12.3); 2.4d (the band) built and deployed 2026-11-16 (main `f1e03d3`, §12.1), its look owed; ⛔ the rings not wired — the atlas computed with the face map and the charts taking over the changes of frame (§4) | replays ✅ (§12.1); walks, the owner's look |
| **2.5** | the old detectors and their state deleted | a replay proving nothing changed |
| **3** | Fable's audit of the whole diff; the docs; then step B's offline round (§5.3) | the owner's look |
| **C** (later) | the tilted pole close in on every kind of face (§10.1) — ⭐ its study, PROPOSED 2026-11-16: [`TILTED_POLE_CLOSE_IN.md`](TILTED_POLE_CLOSE_IN.md) (the rules, the obstacles, one design, the audit; the owner's decisions D-T1 – D-T7); then an offline round and the build | the owner's look |

### 7.3 As built

* **1.1** (2026-11-15, `7cd63a4`, an Opus agent; audited by Fable): `FacetOpts.layout` ("chart") and `.scale` ("normals"), absent by default;
  `chartLevels`, `CHART_CAP_DEG` 1°, `CHART_HEADING_DEG` 0.5°, `CHART_LEVEL_M` 0.2 mm. The gates, rerun by the auditor: the port against the prototype
  (`scripts/probes/chart_port_check.ts`) on the 35 shapes, every frame the assignment uses, both scales — ≤ 2.8 × 10⁻¹⁵ m, the round trip
  ≤ 1.2 × 10⁻¹⁵ m (two shapes have no place to compare: the columns serve none of their faces); 7 vectors (`tests/orbit_charts_map.test.ts`), each red
  on a mutant, and a mutant of the auditor's (a column's bound read at the lower facet's bottom) red on 1 vector and on 25 shapes; **1812 vectors**.
  ⚠ Found: the frames' box (§3); layout "chart" with the built scale is today's map to the rounding, NOT bit for bit (the heptagon's level pitches
  differ in the last digit) — step 2.1's replay compares within a tolerance, or keeps layout "built" until 2.2. ⛔ Not verified: the edge stretch
  (`edgeMm`, `edgeDeg` > 0) and the edge blend on a chart map other than a box.

* **1.2** (2026-11-15, `445a194` and `9718ead`, an Opus agent; audited by Fable): `src/input/orbit_charts.ts` — `chartContour`, `columnsChart` (a
  face's kind, the chart's ends), `candidateAxes`, `modesOf`, `costOn`, `seamTurn`, `assignCharts` (its result: per face its home and kind, the
  frames taken, each cap's layouts), `DEFAULT_CHART_OPTS` (the bounds as parameters: 45°, 30°, 15°; the zones' three read from `DEFAULT_ZONE_OPTS`).
  The gates, rerun by the auditor: the assignment against the prototype's on the 35 shapes (`scripts/probes/chart_assign_check.ts`) — the contour,
  the candidates, every face's kind in every candidate frame, the homes, the frames taken, the caps' layouts: EXACT, the largest gap 0; 10 vectors
  (`tests/orbit_charts.test.ts`), each red on a mutant; **1822 vectors**. ⭐ The audit's find: the border PEEL had no vector (disabled, the first
  nine stayed green; only the comparison caught it, on the cube standing on a corner) — vector 10 pins it. ⚠ Noted for step 2.1: every candidate
  frame is built up front — 10 ms on `Scene_0bis` (160 candidates), 120 ms on the 38-face hull (1 127); nearly free if built only when gravity
  breaks a face or a cap asks for its layouts — to measure on the real scenes. `star.length >= 3` never decides on a convex shape (the prototype's own
  redundancy, kept).

* **1.3** (2026-11-15, `e82262e`, an Opus agent; audited by Fable): `src/input/ring_chart.ts` — `buildRingChart(map, contour)` (the ends, the spine,
  the levels and their pitches, the side faces per height band), `ringTarget` (in `mapTarget`'s shape: `stack` the facet, `across` its chord there;
  `side` −1 always — the rings have no column) and `ringAngles`. The gates, rerun by the auditor: against the prototype's rings chart on the 35
  shapes, a 1° grid (`scripts/probes/ring_chart_check.ts`) — the same face, the point and the levels EXACT (gap 0), the round trip ≤ 4 × 10⁻¹⁵ m;
  12 vectors (`tests/ring_chart.test.ts`), each red on a mutant, three more mutants of the auditor's caught; **1834 vectors**; a place costs
  0.3 – 0.8 µs. ⚠ One departure from the prototype, kept: on a cap the way back solves the yaw by steps (≤ 8) — the prototype reads the azimuth about
  the cap's centre while its place reads the rim about the SPINE 1 µm inside the cap: 0.2 µm apart where the spine slants (the shed). ⚠ A cap's place
  can sit 0.5 µm outside the cap's polygon (the rim read 1 µm below it — the prototype's). The repair of the levels decides nothing on the 35 shapes:
  a bevelled box (the vectors' "barrel") pins it.

* **1.4** (2026-11-15, `c2f3d3a`, an Opus agent; audited by Fable): `edgeShareSmooth` beside `edgeShare` — EXACTLY `edgeShare` wherever the run is
  at least four minimum zones and the zone share under 50 %, 1 where `edgeShare` is 1, and between two and four minimum zones the interior share rises
  to 1 by a smoothstep (⛔ `edgeShare`: 0.25 → 1 in one step as a face's width passes 6 cm — pinned by a vector); `CalmKnobs.smooth` (absent: today's)
  makes `calmTarget` read it. 6 vectors (`tests/orbit_calm.test.ts`), red on 12 mutants of the agent's and one of the auditor's; `calmTarget` without
  the knob equal to its old body on 560 places × 3 knob sets; **1840 vectors**. ⚠ "The rule for every face" (a fan's too) and "no fade by the pitch"
  are the wiring's (`poleWeight`, the zone's facets): step 2.3.
* ⭐ **Steps 1.1 – 1.4 are closed** (2026-11-15): four modules built ahead of their wiring, 1805 → 1840 vectors, the game unchanged.
* ⛔⛔ **2.1, THE REPLAY COMPARED NOTHING — found at step 2.2, the same day, and fixed.** The first baseline (and the first "IDENTICAL, bit for
  bit" of the rebuild against it) was HOLLOW: in every recording the camera, the piece and the gizmo travelled 0.00 m. The game's own watchdog
  (`main.ts`: no frame drawn one second after the start → a full-screen error box) fires under the probe's virtual clock — no frame is stepped while
  the page loads — and its box took every press of the script. ⚠ The probe is unchanged since CL1 (2026-11-14) and the watchdog is older: CL1's own
  bit-for-bit check was most likely hollow too (not rerun). ⭐ `METHOD`: *a gate that cannot go red is not a gate* — the probe now removes the
  watchdog's box, stops on any other error box, prints what the script MOVED and fails when it moved nothing (`replay_probe.mjs`); two tools beside
  it: `replay_cmp.mjs` (the largest numeric difference per recorded field) and `replay_health.mjs` (steps, stalls, the camera's up).
* **2.1, the replay's BASELINE, re-recorded** (2026-11-15, Fable; the owner's go: the runs on the owner's PC, cleaned after): seed 1, 40 legs,
  2 794 frames on today's game (`510bbd8`, the main folder) for `Scene_1`, `Scene_0` (`?sceneIndex=0`), `Scene_0bis` (`?sceneIndex=4`) — the gizmo
  travels 23 – 25 m a run, the camera 440 – 480 m. How well it repeats on today's game: `Scene_1` and `Scene_0` identical bit for bit; `Scene_0bis`
  31 frames (3 – 33) apart by up to 3 × 10⁻⁹ m, then identical — so the gate on `Scene_0bis` is numeric (≤ 10⁻⁶ m), and a `Scene_0` run can show
  the same last-digit noise. Nothing left in the temp folder; the three baseline recordings (16 MB) kept in the session's scratchpad.
* **2.1, the INVENTORY** (2026-11-15, `312d299`, an Opus agent; samples checked against the code by Fable — the dead edge blend, `placedBox`, the
  zone's wait, the tilt's map index, the sway's writer: all as written): [`ORBIT_STATE_INVENTORY.md`](ORBIT_STATE_INVENTORY.md), sections A (the 53
  fields, each with its writers, readers, kind and coordinate space), B (the three changes of frame and their order), C (the specificities' paths
  and the map fields they read), D (the two `buildFaceMap` calls), E (the angle assumptions outside the map: `holdsPole`'s 45°, `poleWeight`'s
  60 – 85°, the spit's 60° / 75°, `snapHeading`'s 90° — each a risk under the normals' scale or a frame off the world's axes), G (the sway), F (14
  open questions — among them: a pick-up resets four fields only, a put-down none, so the tilt, the zone and the calm carry from one held part to
  the next; `asmSupport` and two fields of the dy hold are never read; `GIZMO_MEMO` is keyed by the frame count and the angles only). ⭐ **Step 2.1
  is closed.**

* **2.2** (2026-11-15, `9e38e78` and `7463174`, an Opus agent; audited by Fable): the tunable `chartLayout` (0, the default: as built; 1: both
  face maps built with `layout: "chart"`, `scale: "normals"`), its slider beside the faces-contour ones (GIZMO & SECTIONS), `?chartLayout=1` on the
  URL; the wiring's whole change: `...chartOpts(st)` in the two `buildFaceMap` calls and `#C…` in their cache keys. 5 vectors
  (`tests/orbit_charts_switch.test.ts`), the source pin of `tests/facets.test.ts` and the menu's pinned tree following the source; **1845 vectors**.
  ⭐ **The replays (the fixed probe), against today's game:**

  | scene | switch OFF | switch ON |
  |---|---|---|
  | `Scene_1` | identical, bit for bit | the same play: at most 7 × 10⁻¹⁰ m apart, never over 10⁻⁹ |
  | `Scene_0` | identical, bit for bit | ANOTHER play from frame 0 (the gizmo 87 mm away at the boot's angles), no error; the gizmo's largest step 91 mm (98 today) |
  | `Scene_0bis` | at most 3 × 10⁻⁹ m apart (today's game against itself: the same) | ANOTHER play from frame 5, no error; the gizmo's largest step 94 mm (100 today) |

  ✅ **The owner's look with the switch on** (2026-11-15): *"everything ok with charts switched on"* — ⚠ on which device: not stated. (A desktop
  recording of `Scene_0bis` sent the same day — quick turns, a camera roll passing nearly upside down — was withdrawn: *"disregard my two previous
  conversations. The charts were switched off."*; with the switch off the build replays as the game before it.)
  ⛔ Owed: the walks' rules on `Scene_0` and `Scene_0bis`; the test scenes.
* **The two fixes the owner asked for** (2026-11-15: *"- fix that centre reading in this build. - state carry over : this is not intended. Fix
  it."*; an Opus agent, audited by Fable):
  * ✅ **The orbit's starting state has ONE home** (`f1b7573`, kept): `orbitStateStart()` (37 fields) applied by `resetOrbitState(st)` at the
    scene's creation and at each pick-up (`model_bodies_wiring.ts`), the frame's gizmo memo cleared with it — a newly held part no longer inherits
    the last one's tilt, zone, calm, mouth, dy hold or pending tilt; `tests/orbit_state_reset.test.ts`. ⛔ Not applied at the test scenes' piece
    switch (`spawnOrbitPiece`, `respawnStuckPiece`): the owner's to decide. Found, not fixed: the section lines' caches (`asmRedCache`,
    `asmGreenCache`) ignore the held part.
  * ⛔ **The centre read from the model** (`a3826a1`) — **REVERTED** (`8008ce0`), the owner's to decide. The replay differed from frame 0 on the
    three scenes, and the cause is not the sway: today `st.asm.centre` is the **ORIGIN** [0, 0, 0] on the three scenes — `placedBox` reads the
    meshes' world boxes at the first frame, before they are placed (radius 0.245 / 0.365 / 0.2415 m) — and from the model it is
    [0.0025, 0.2444, 0.191] (`Scene_0`, `Scene_0bis`) and [0.0231, 0.257, 0.1704], radius 0.2828 m (`Scene_1`): the centre 31 cm away, the look
    point 0.24 m at frame 0 — another framing of the camera, not a last digit. ⚠ Every look the owner closed was with the centre at the origin
    (the floor's middle). The fix is `git revert 8008ce0` away.
* **What was deployed** (2026-11-15, the owner: *"Deploy afterwards so i can test scene 0 and scene 0bis"*): `8008ce0` = steps 1.1 – 2.2, the
  state's one home, the probe's fix; **1851 vectors**; the replay with the switch OFF against today's game: `Scene_1` and `Scene_0` identical bit
  for bit, `Scene_0bis` at most 2.9 × 10⁻⁹ m apart (its own noise). Merged into `main` as `7db32b6` (main's tree = the branch's).
* **CL1's bit-for-bit check REDONE with the fixed probe** (the owner: *"Do it."*): the code before the clean-up (`eeec345`) against after
  (`1b34f62`), the gizmo travelling 22 – 25 m a run: `Scene_0` and `Scene_0bis` identical bit for bit; `Scene_1` identical bit for bit in one of
  two runs, within 7 × 10⁻¹⁰ m in the other — the replay's own noise. **CL1 changed nothing**; its first check was hollow, its conclusion holds.
* **The owner's decisions on the two fixes** (2026-11-15): *"Center: keep the origin for the moment"* — `8008ce0`'s revert stands; *"State reset:
  do what is best for"* (the message ended there) — read as the builder's call: `resetOrbitState` wherever a piece starts being orbited (the
  test scenes' piece switch and the stuck respawn too). ✅ **Built** (Fable): `spawnOrbitPiece`, not at the boot, applies it after the piece
  orbit's own reset, and clears the spring's last place (`boxOrbit` — the assembly's frame read it once more, the gizmo one frame at the old
  angles). Probed in the app, a switch under a tilt on `Scene_1`: ⛔ before, the boot's angles were read in the tilt's frame — the piece ended at
  the BACK of the cube with a dy hold; now the gizmo is at the boot's place on the switch's own frame (`Scene_0`, `Scene_0bis` in its zone: the
  same). **1857 vectors.** Found, not changed: a switch or a respawn keeps the APPROACH (a piece stuck close in respawns close in — the boot's is
  far); a pick-up (`Scene_2`'s flow) still reads the last spring place for one frame.
* **The black scene on the phone: solved** (the owner, 2026-11-15: *"it is now working on the phone. solved."*) — its cause was never found.
* **A black scene on the owner's iPhone after the deploy** (`7db32b6`, the switch off; the HUD: `frame —` after eight minutes, the canvas the
  page's own background) — not reproduced (desktop Chrome, a phone-sized emulation), its cause unknown, not reported again since. `2cae564`
  (local, ⛔ not deployed): the HUD's `draw` line — the WebGL context (lost, restored, an error), the frames drawn, the last frame's interval as
  it was, the canvas's size and its buffer's; **1856 vectors**.
* **The tilted pole close in, and a band against input noise** (the owner's two notes for later, 2026-11-15) → §10.
* **2.3** (2026-11-15, the owner: *"continue to next step"*; `fcfa8bd`, an Opus agent; audited by Fable): **the calm on every side face of the map
  in use**, behind `chartCalm` (0 by default; the slider after `chartLayout`'s, GIZMO & SECTIONS) — on only with `chartLayout` 1 too (`calmRules`,
  `orbit_calm.ts`: under the old layout a tip's fan is squeezed into 30° of orbit, where the calm jumped the view — removed 2026-11-14). Three
  rules, all off otherwise: the shares CONTINUOUS on a narrow run (`CalmKnobs.smooth`); a polar zone's own facets — a fan's — calmed as any side
  facet (the two blocks of `calmTargets` that excepted them skipped); NO FADE BY THE PITCH on a side facet's reading (`CalmState.poleFade` false,
  taken from the target at once; the cap's reading keeps `poleWeight`, `facingWeight` stays everywhere). ⛔ Untouched: the world camera's heading
  (`calmFrame`: `calmLevelHeading`, `heldOffsetStep`) — step 2.4's. 10 vectors (`tests/orbit_calm.test.ts`, `tests/chart_calm_wiring.test.ts`),
  red on 21 mutants; **1867 vectors**. The gates, rerun by the auditor: both switches off — the three scenes identical BIT FOR BIT to the commit
  before; `chartLayout` 1 with `chartCalm` 1 against `chartLayout` 1 alone:

  | scene | the replay | the view, one frame (with the calm · without) |
  |---|---|---|
  | `Scene_1` | identical bit for bit ✅ | — |
  | `Scene_0` | the same play, the piece within 10⁻⁴ m at the first difference | the same |
  | `Scene_0bis` | another play, no error | largest turn 13.0° · 12.9°; rolls over 20°: 8 frames · 3, the largest 28.3° · 23.8° |

  ⚠ `Scene_0bis`'s rolls over 20° are fast turns round a tip spread over 3 – 4 frames under a fast finger (8 – 10° of view a frame), not the
  single-frame jumps of 2026-11-14 (22 – 50°); two plays are compared, not one path. And §5.1's own measure stands: the present fan is never seen
  more than 27° off square with or without the calm — on the three scenes the gain is small; a steep tip or a fan of three needs it. ⛔ Owed: the
  owner's look on `Scene_0bis` with both switches on.
* ⛔⛔ **THE TILT'S EXIT AT A POLE, AND THE TILTED FACET'S BORDER — found measuring 2.3's baseline, fixed** (Fable, `72cdc54`). With `chartLayout`
  1 the replay of `Scene_0` held two rolls of 157° and 140° in ONE frame (none with it off; the owner's look had not hit them). Two causes:
  1. **The tilted facet's border** (the charts' layout only): the levels are the faces' bisectors, so a press with the gizmo on the ridge made
     the tilt with the gizmo EXACTLY on the tilted facet's border; the map's place there was read on the neighbour — "over the edge", the roll
     back and the exit within four frames of the press. Now a place within a micrometre of the tilted facet is on it (`onTiltedFacet`,
     `TILT_TIE_M` — a tie, not a band: §10.2's is still owed).
  2. **The exit at a pole — a fault of today's game too.** A direction straight up or down has no heading: `anglesOfDir` fell back to the
     orbit's hint, 0, so a tilt left with the orbit exactly at the world's pole set the yaw to 0 and the view rolled there in one frame. Probed in
     the app with both switches off: on `Scene_1`'s top, the piece brought in (the automatic tilt on) and back out (off) rolled the view 90° in one
     frame. Now the exit hands the heading the camera shows (`anglesOfDir`'s `poleYaw`, `turnAngles`, `tiltOff`): 9° there (the world camera's own
     calm heading, as at any exit by distance).
  2 vectors and the wiring's pins, red on the code before; **1869 vectors**. Replays: both switches off identical bit for bit on the three scenes;
  `chartLayout` 1: `Scene_1` and `Scene_0bis` identical, `Scene_0` from the press on the ridge on — its largest roll in a frame 14° (157°).
* **Deployed a second time** (2026-11-15, the owner: *"deploy"*): `6d5f2b7` — step 2.3 behind `chartCalm`, the two fixes above, the orbit state's
  reset at a piece's spawn, the HUD's `draw` line — merged into `main` as `157974f` (main's tree = the branch's), live; **1869 vectors**; both
  switches off the three scenes replay bit for bit as the build before. ⛔ Owed: the owner's look on `Scene_0bis` with both switches on, and on
  `Scene_0`'s ridge with `chartLayout` on.

⭐ **TEST SCENES OF THE BUILDER'S CHOICE** (the owner, 2026-11-15: *"You can also create virtual scenes in another worktree to test our pipeline on
geometries of your choice. I can then review later and delete the worktree once done."*): from step 2.2, a throwaway worktree beside this one — the
rebuild branch plus levels made for the test (a shed, a gable house, a pyramid roof, fans of three, a tilted body: the shapes of §6 the game's data can
express) — where the game's real pipeline is replayed and walked on them. ⛔ Never merged: the owner reviews it, then deletes it.

⭐ **The replays, the walks and the looks are on `Scene_0`, `Scene_0bis` and `Scene_1` only** (the owner — `Scene_2` is out, §4.4). A headless run
  cleans after itself (the owner: *"make sure not to fill my disc with temporary data: clean afterwards"*): its own Chrome profile in the temp
  folder, Chrome's temp files inside it, the profile removed when the run ends, the temp folder checked after the batch.

Step 1 changes nothing on the screen: no module is imported by the game. Through 2.2 – 2.4 a switch between the old and the new stays in the build
(a slider), so both are compared in the same minute on the device; it goes with 2.5.

## 8. DECISIONS

**Taken** (the owner, 2026-11-15): the order of the rules (§1); step A may change `Scene_0`'s mapping; step B a later milestone; the working mode (§7.1).

**The defaults below — the prototype's, approved with the charts (2026-11-15), each still the owner's to change:**

* **D-C1 — a rectangle that gravity sees as a diamond** (a cube turned 30° about a level axis: its two end squares stand on a corner, their top the
  ridge's end). Default: gravity's chart keeps it, BENT (up to 60° off square), no roll. The other way: its own tilted frame — square sections, the
  view rolled 30° or the sections turned 30° on the glass. No scene has one.
* **D-C2 — a level face that is not a rectangle** (a pentagon or a triangle cap): no frame makes it a cell. Default: polar at every distance. The
  other ways: bent toward its far corner (what today's tilt gives), or a new layout of its own — straight parallels from the entry edge, a camera
  turn at every other exit. No scene has one.
* **D-C3 — the two bounds**, 45° (the cost of a tilted rectangle) and 30° (the turn at a frame's border): guesses, each a slider.
* **D-C4 — `Scene_0`'s two top faces without their tilt** (§6): the visible change of step 2.4, judged there.
* **D-C5 — fans whose faces are not all broken** (an icosahedron's middle band): RINGS, never a patchwork of partial fans. No scene has one.
* **D-C6 — far out, a pole held by an edge or a point**: as today (the polar orbit); nothing new.

## 9. CORRECTED SINCE THE CONVERSATION'S FIRST FIGURES (2026-11-15)

The calm study first read each level's pitch as the mid-range of every face touching that height. On other shapes that rule puts two levels at one
pitch — a 328 mm leap on a cube standing on a corner. The rule of §2.2 replaces it. On `Scene_0` the two middle levels are −13° and **38°** (first
given as −13° and 32°), the bottom level −58° (−45°), and an end face reads 16 % / 4 % (first given as 10 % / 3 %); the other rows are unchanged.

The shed (found at step 1.1): this file and the artifact said today's rule takes its 60° roof for a cap. It does not — that roof's normal is 30° up,
under the 45° bound: today the side band stops at 45° and the place is pinned on the high edge's middle beyond it (8.4 % of steps move nothing).
§2.2 now says so; a roof sloping LESS than 45° is the one today's rule makes a cap.

## 10. FOR LATER — recorded at the owner's request (2026-11-15)

### 10.1 The tilted pole close in: KEPT — general on every geometry by a step of its own (step C)

The owner: *"I want to know if this is a feature that you intend to keep and make sure it works for all the geometries and topologies you are
rebuilding the code for, or is it something that will need its own rebuild ? If so, capture in the md file for later on."*

**Kept.** It is rule §3 6., a cap's square layouts — computed for every cap since step 1.2 (`assignCharts().layouts`, equal to the prototype's on
the 35 shapes). Step 2.4 re-homes its trigger and its exit in the one transition (§4); on the three scenes it behaves as today. ⭐ Checked on the
build (`2cae564`, a headless run, the switch off and on): within `tiltAutoM` the automatic tilt fires on `Scene_1`'s top and bottom and on
`Scene_0`'s two top faces and its bottom, and rolls back at the edge — `Scene_1` the same line for line with the switch on.

⛔ **Not made general by steps 1.1 – 2.5** — two reasons:

1. **The close-in machinery is today's wiring, about the WORLD's vertical**: the latch by distance, the camera pending then blended by the
   finger's travel, the square camera, the swing and the roll back, the mouth's hand-over (`tiltOn`, `capTilt`, `holdsPole` on the world's map) —
   and it never fires inside a polar zone (`POLAR_ZONES.md` §4.2 1.). The prototype never ran close in (§6: not covered).
2. **Most kinds of face have a default close in, or nothing:**

| the face | close in |
|---|---|
| a level rectangle (`Scene_1`'s top and bottom, `Scene_0`'s bottom) | four square layouts, one per entry edge — as built ✅ |
| a slanted face holding the pole across a ridge (`Scene_0`'s two top faces) | tilts by its own angle today; a plain cell under the charts, the tilt dropped (D-C4) — the owner's look at step 2.4 |
| a level face that is not a rectangle (a triangle, a pentagon) | no square layout exists; the default is polar at every distance (D-C2), two other ways listed — no scene has one |
| a fan round a point (the tips; any polar zone) | the zone's polar orbit, no tilt — as built; `Scene_0bis` whole |
| the cap of a frame that is not gravity's (a tilted body's top, an upright zone's cap) | its layouts are computed; the wiring cannot use them |
| a BENT cell (`Scene_0`'s two ends), a face left to RINGS | no change of frame; the square camera alone |

**Step C** (after 2.5 — the tilt's trigger must be the one transition first): an offline round on the 35 shapes and the test scenes — per kind
of face, whether close in changes the frame, which layout, each exit's turn and the camera's path through it; the owner's decisions (D-C2, D-C4,
the rows above); then the build, closed by the owner's look. Until then close in is today's, on the three scenes.

### 10.2 A band against input noise at every trigger of a camera movement

The owner: *"for later on: consider adding hysteresis where needed (for example crossing of edges which trigger camera movement) so that input
noise does not transfer to camera movement (see attachment in example)"*.

**The example** (two screenshots, `Scene_0bis`, build `7db32b6`, close in — the piece 0.12 – 0.15 m from the yellow target, one pointer down,
STATIONARY): the gizmo at the corner where two of the body's front faces meet a tip's faces; the view square to the body's face in one, turned
toward the tip in the other. **Its cause, read in the code**: close in the square camera's target is the normal of the face the gizmo is on
(`squareFrame`: `asmSquare.target = asmShown.t.normal`), read every frame with no band — the place's noise across the edge flips the target
between two normals far apart, and the camera travels from one to the other at `tiltRollDegS`.

**What has a band today** (read 2026-11-15; to re-read when this is taken up):

| the trigger | its band |
|---|---|
| the automatic tilt's latch by distance | on within `tiltAutoM` (0.6 m), off 0.05 m beyond (`TILT_AUTO_HYST_M`) |
| out of a polar zone | `zoneExitMm` (10 mm) past its rim |
| the spit's side (the camera over the axis) | `SPIT_SIDE_HYST_DEG` (2°) |
| a half-turn crossing | the dy that crossed held `edgeHoldMm` (30 mm) into the face beyond — that dy only |
| ⛔ the square camera's target close in | none — the example |
| ⛔ the automatic tilt made at an edge close in | none — **measured in today's game** (the replay, `Scene_1`, both switches off, the approach 0.61): a fast dy onto the bottom face and off it within the frame makes the tilt and leaves it at once — the view rolled 45° and 90° in ONE frame (frames 1120, 1137) |
| ⛔ to check: the calm's normal (eased, not banded), the tilt's exit by a dx | — |

**Where it lands**: step 2.4 — every change of frame becomes the one transition (§4), so its trigger gets ONE band; the square camera's and the
calm's targets are views, not frames: theirs with step 2.3 / step C. Each band in millimetres ON THE MODEL (⛔ corrected 2026-11-16 — on the glass at the far camera `gizmoEdgeMarginMm` was 26 cm; an edge is a place on the assembly), a slider with
the rule. ⚠ Its cost, to weigh at each: a band is a delay at every real crossing — the view stays the last face's for the band's depth.

## 11. THE ROOT CAUSE FOUND AT THE OWNER'S LOOK ON THE SECOND DEPLOY (2026-11-15) — the basis of step 2.4

The owner, on `157974f`: *"overall is good"*, then four reports and one instruction:

1. `Scene_0bis`, both switches on: *"when I cross the edge to go from the rectangle face to the triangle face … it seems the calm unleashes and there
   is a very brief acceleration of the camera orbit to reach the triangle face. This does not occur when I cross from the triangle face to the
   rectangle face. Also, this does not occur in scene 0 nor scene 1. Why ?"*
2. `Scene_0`, the charts' switch on: *"when I arrive from another face to one of the top slanted face or to the bottom face and I release and click
   again: the moment I click again, the camera realigns and the red and green sections become orthogonal. I don't know what triggers this … this
   creates disturbing camera movements."*
3. *"there are 180 camera tilts on the top slanted surface but I cannot catch when nor what triggers them."*
4. *"I arrived in a configuration where the gizmo and sections were in the face opposite to the camera."*

⛔ **The instruction: *"analyze the deep root cause, don't patch with fix which may conflict with other rules"*.**

**Measured** (the replays, the same script on each): a tilt is made AT A PRESS 11 – 13 times a replay in today's game (both switches off, `Scene_0`
and `Scene_1`) and as often with the charts' layout on; the view makes a half turn (150° or more within 30 frames) 18 times on `Scene_0` off, 16
on, 11 on `Scene_1` — 12 of the 16 at a tilt's EXIT; report 1 reproduced in the app, far out, a steady finger: the view 0.2° a frame on the
rectangle, 6 – 8° for a moment at the edge, 2 – 3° on the triangle (the way back peaks at 4°). Report 4 is not in any replay: it is explained by
reading, below — not reproduced.

**ONE ROOT CAUSE: where the orbit is, is stored twice, and what a face is, is decided twice.**

1. **Two states for one place.** The ORBIT's angles are a DIRECTION (they place the camera; every change of frame turns them by a rigid rotation —
   `turnAngles`). The MAP's angles (`asmMapQ`) are a CHART COORDINATE (they place the gizmo; after a change of frame they are re-read at the gizmo —
   `mapAngles`). The two are equal only where the map is the identity between a direction and a place. At a pole a direction has no yaw. Under the
   charts' layout the pitch is a chart coordinate everywhere, in every frame. After a change of frame the two are brought together only by the
   catch-up's small steps (`mapAnglesStep`), never across a jump — so the camera can come down one side of a ridge and the gizmo the other
   (report 4). ⚠ `72cdc54` (deployed) is a patch on this: leaving a tilt at a pole it picks the yaw that keeps the PICTURE (before it: yaw 0) —
   neither looks at the side the gizmo is on.
2. **The old detectors still decide where a frame changes.** `holdsPole` — a cap, or a side steeper than 45° — makes the tilt at ANY press far out
   and by itself close in: `Scene_0`'s bottom and its two top faces, `Scene_1`'s top and bottom, in today's game too. Its entry swings the camera
   square to the face and holds its up on the frame's axis (report 2: the sections horizontal and vertical on the glass); its exit over the ridge
   or a far edge is a half turn (report 3). Under the charts' layout the pole is the RIDGE and the two top faces are plain cells: the tilt there is a
   second answer to a question the layout has already answered (D-C4). Three mechanisms meet at that ridge — the tilt's entry, its exit, the world's
   own crossing — each with its trigger: which one turned the camera cannot be told from the glass.
3. **The calm reads per-face rules with different references.** A vertical facet's vertical share reads the BOX's height (the bounce, 2026-11-04),
   a slanted one its own extent (2026-11-09), and a polar zone's border was made whole by a third rule (2026-11-14) that step 2.3 removed. In the
   zone's frame the body's faces are vertical under a tip's facets: at the rectangle's own edge the share is 0.41 (the box's top is the apex,
   120 mm further), on the triangle 1 — a 20° step of the view, eased in 120 ms (report 1; the way back gives it back on a face where the view
   barely moves). The same shape as 1 and 2: the view computed from WHICH FACE the place is on and that face's own convention, not from the place.

**What follows — no patch; step 2.4 is built on it:**

* **One state**: the gizmo's place and its chart's angles. At every change of chart the orbit's angles are DERIVED from them (§4.1: "the gizmo stays
  at its exact place; the next chart's angles are read there"), and the camera's turn is the seam's own, known beforehand — ⛔ never two conversions
  that must then agree.
* **The frames change where the atlas says** (§3), not where `holdsPole` fires: on `Scene_0` no tilt on the two top faces (D-C4); a level cap keeps
  its square layouts (§3 6.) — ⛔ the owner's to decide: whether a press far out still tilts a cap, or close in only.
* **One trigger, one band** (§10.2).
* **The calm's shares on one reference** — the chart's own runs, every face alike — or step B (§5.3: the view read from the place).

**The day's patches, as they stand**: `72cdc54` (the heading kept at a pole; the tilted facet's border a tie) is deployed and stays until step 2.4
replaces the two conversions — it removes a 90° roll of today's game and is flagged above. The fix built for report 1 (a vertical facet's vertical
share whole toward its own end under a slanted one: 8.1° → 4.5° a frame) is SHELVED, not committed (`git stash`): one more per-face rule.

### 11.1 The press's action: where it comes from, what it turns (measured 2026-11-15)

The owner: *"Why does a press have an action at all on the orbit? There was not press input on the orbit in my previous build. Why did it appear now?"*

**Where it comes from** — the owner's rule of 2026-11-09 (`POLAR_ORBIT_CLEANUP.md` §9: *"when the left click or finger is pressed for orbiting, the orbit
tilts so the face currently holding the gizmo becomes the one with the red and green sections which are perpendicular"*), decision 1 (c) of
2026-11-10 (the heading swung square at the press, 0 – 45°), built `b7548b5` (`1.0.117-`). In every build since: `12dc4b6`, `de789f6`, `825e62c`,
`d2f7738`, the build before the charts (the switches off replay bit for bit). Far out only (close in the tilt makes itself, 2026-11-10); since
2026-11-12 (`785ea5a`, F2b) on a side beyond 45° too — `Scene_0`'s two top faces. ⛔ The only action a press has on the orbit.

**Measured** (the scratchpad's `tilt_check.mjs`, `MODE=press`: far out, the gizmo brought onto the face, 90 frames of rest, then a press held STILL
150 frames — no finger travel; the gizmo moved 0.0 mm in every case; the view's turn):

| the face, the camera | the switch off (= the build before the charts) | the charts' layout on |
|---|---|---|
| `Scene_1` top, square | 0.0° | the same (`Scene_1` replays bit for bit) |
| `Scene_1` top, 30° off square | 13.3° in 5 frames (7.1° in one) — decision 1 (c)'s swing | the same |
| `Scene_0` top slanted face, square | 9.5° in ONE frame, back on the same view within 40 | 6.9° in one frame, at rest 3.4° away |
| `Scene_0` top slanted face, 30° off | not measured (below) | 15.2° (8.9° in one frame) |
| `Scene_0` bottom, square | 2.2°, eased over 40 frames | 9.2°, eased over 40 frames |
| `Scene_0` bottom, 30° off | 13.3° (7.2° in one frame) | not measured (below) |

**Read**: on the cube, square, the press is unseen (the 2026-11-10 probe's 0.0 mm); off square it is the swing decided then. On `Scene_0` the entry was
never seamless, and less so under the charts' layout: the world frame's view of a place and the tilted frame's view of the SAME place are two
conventions (§11, 1. and 3.) — the bottom looked at from 51° below, then 53° (off); from 67°, then 76° (on).

**Also seen**: a tilt made at a press and then left kept the swung heading (the orbit's yaw −60° → −90°: the second cell not measured — the way
down made and left a tilt). ⚠ The first cell not measured was the SCRIPT's fault, not the game's: its drag began on the HUD's lines at the bottom of
the glass (a press there is not the orbit's); begun higher, the dy reaches the face.

✅ **Decided and built** (the owner, 2026-11-15: *"Instruct the Opus agent to cancel my rule and remove the press action on the orbit."*) → §12, step P.

## 12. STEP 2.4 — THE DESIGN AND THE BUILD (2026-11-15)

The owner: *"Instruct the Opus agent to cancel my rule and remove the press action on the orbit. Then build step 2.4 as you have recommended in your
previous message."* — the recommendation: ONE STATE (the gizmo's place and its chart's angles, the camera derived from it at every change of frame);
frames change only where the charts say, with one trigger and one band against input noise; the calm's shares on one reference for every face (§11).

⭐ **Everything of step 2.4 is under `chartLayout` 1** (the calm's part under `chartCalm` too): with it 0 the game replays bit for bit — every
sub-step's first gate. ⛔ The layout alone with the old detectors (what `157974f` showed with the switch on) is no longer reachable.

| sub-step | what |
|---|---|
| **P** | THE PRESS'S ACTION REMOVED, unconditional: a press does nothing to the orbit; the tilted pole close in only (the automatic tilt) |
| **2.4a** | THE ATLAS DECIDES WHERE A FRAME CHANGES (`assignCharts` on the world face map, per placed set): a face tilts only if it is a CAP with a square layout (§3 6.), its heading one of the layouts' — ⛔ `holdsPole` (a side beyond 45°: `Scene_0`'s two top faces, D-C4) and the virtual cap of a pole held by an edge; the zones are the frames the atlas takes (§3 3. – 4.) — ⛔ `polarZones`' detectors |
| **2.4b** | A POLE HELD BY AN EDGE OR A POINT IS CROSSED BY THE ONE TRANSITION, close in (far out it stays the polar orbit's limit, D-C6): `Scene_0`'s ridge — the half turn and the hold of §1, with no tilt |
| **2.4c** | ONE STATE AT EVERY CHANGE OF FRAME: the tilt's entry and exit and a zone's switch are the one transition — ⛔ `turnAngles` (each angle state turned as a direction) and the map's catch-up after it |
| **2.4d** | ONE TRIGGER, ONE BAND: the face under the gizmo read ONCE by the edge rule (`faceSwitches`, `gizmoEdgeMarginMm` — world millimetres: an edge is a place on the assembly) for every trigger of a camera movement — a change of frame, the square camera's target (§10.2) |
| **2.4e** | THE CALM ON ONE REFERENCE (under `chartCalm`): a side face's vertical share reads its OWN run between its level edges, a vertical face as a slanted one — ⛔ the box's height for a vertical face (the bounce's rule, 2026-11-04: kept with `chartCalm` 0) |

**THE ONE TRANSITION** (§4.1), as built from 2.4b on: 1. the frame set at once; 2. the gizmo KEPT — the new chart's angles read at its exact place
(`mapAngles`); 3. EVERY angle state set to those angles (the orbit's, the solver's memory, the solved piece's, the spring's at rest, the camera's
follow state, the map's) — ⛔ never each turned by a rigid rotation with the map's angles left to catch up; 4. the picture carried from the pose
SHOWN by ONE camera turn (`asmZoneMix`: timed at `tiltRollDegS`, the gizmo held — or by the finger's travel where the automatic tilt blends, the
gizmo free), the piece's shown direction eased on the same clock; 5. a half turn sets the dy hold.

**Not in this build**: the RINGS chart's wiring (no scene leaves a face to it — a face whose home is RINGS stays on gravity's columns map, as
today); far out a pole stays the polar orbit's limit (D-C6: with the press gone a top face, a ridge, a cap's centre are crossed close in only —
⛔ the owner's to change); step C.

### 12.1 As built

* **P** (2026-11-15, `5894ab2`, an Opus agent; audited by Fable): `tiltOnPress` and its call deleted, `tiltOn`'s `why` with it (one caller left: the
  automatic tilt, its verdict byte for byte); no slider removed (each is still read), two labels corrected; 1 vector, red on the code before;
  **1870 vectors**. The auditor's gates: a press held still on `Scene_0`'s top slanted face and bottom and on `Scene_1`'s top, square and 30° off,
  both layouts — no tilt, the view 0.0°; the close-in run (approach in, the automatic tilt made by a dy, orbit in it, approach out) on `Scene_1` and
  `Scene_0` (both layouts): IDENTICAL line for line to the code before. ⚠ Far out the replays are another play from the first press that tilted.
* **2.4a** (2026-11-15, `44ba40e`, an Opus agent; audited by Fable): `capTiltHeading` (a CAP with a square layout tilts, toward the layout's
  heading nearest today's — today's own value on a world-aligned cap; a side however steep, a cap that is not a rectangle, a virtual cap: none) and
  `chartZones` (the frames the atlas took as `PolarZone`s: their OWN faces — `used[].own`, new — the axis signed as `polarZones` signs it) in
  `orbit_charts.ts`; the wiring's `atlasOf` (cached per placed set and the three zone knobs), `tiltOn`, `nextTiltHeading`, `zonesOf` under the
  switch. 16 vectors (`tests/orbit_charts_atlas.test.ts`), red on 21 mutants; the assignment still EXACT against the prototype on the 35 shapes;
  **1886 vectors**. The auditor's gates — replays against P's: the switch off, the three scenes IDENTICAL bit for bit; on, the three identical
  too (`Scene_0bis`: the atlas's zone IS `polarZones`'; the script never tilts on `Scene_0`'s top faces); the close-in run on `Scene_0`: on, no
  tilt on a top face, the orbit stopping at the ridge (2.4b's), the bottom tilting as before; off, as before. ⚠ Found by the agent, no scene has
  it: a tipped heptagon whose axis is 10 – 20° off the VERTICAL — `polarZones` finds one whole upright zone, the atlas a WORLD frame square to
  the axis serving 6 faces: the assignment's rule on a shape outside the 35 — for the test scenes and step 3.
* **2.4b** (2026-11-15, `a57796e`, an Opus agent; audited by Fable): `src/input/pole_crossing.ts` — `poleCrossingDue` (the trigger: the charts on,
  the world's frame, close in, no turn under way, the map at a pole whose end is an EDGE or a POINT, the finger asking beyond), `farFacetAt` (the
  face across the pole at the place), `poleSeam` (its angles there, the pitch on the pole); the wiring's `seamRebase` (EVERY angle state SET to a
  chart's angles — `turnAngles`'s list, nothing turned; written for any chart: 2.4c's) and `poleCross` (the one transition: the place kept, the far
  angles, the rebase, the views carried, one camera turn from the pose shown, the dy hold). 22 vectors, red on 29 mutants; **1908 vectors**. The
  auditor's gates — replays against 2.4a's: off, the three scenes IDENTICAL bit for bit; on, identical too (the script never pushes past the ridge
  close in); in the app, `Scene_0`, close in, ONE drag up the front top face: exactly ONE crossing, the gizmo 0.0 mm while the camera turns, the
  view ≤ 6.4° a frame (360°/s), the piece on the glass ≤ 0.05° a frame through it, the dy held for the rest of the gesture (54 of 54 readings);
  the dy reversed: down the far face; one drag back up: one crossing back. ⚠ A NEW gesture pushing the same way crosses again — the owner's rule
  of 2026-11-14 (the hold ends with the gesture). ⚠ Not measured: the spring's leftover lag at the crossing (30 ms, zero with the square camera whole).
* **2.4c** (2026-11-15, `c25a1cc`, an Opus agent; audited by Fable, one fix `1327ade`): under the switch `tiltOn`, `tiltOff` and `zoneSwitch` (with
  a place shown) are the one transition — the frame at once (no swing, no roll back inside F), the new chart's angles at the gizmo, `seamRebase`, ONE
  camera turn from the pose shown (`seamTurnStart`: paced as the swing was when the tilt is made with the camera pending — held, then by the finger's
  travel, then by time; else by time, the gizmo held), the piece's shown direction eased on that turn (`asmDirEase`, applied in `dirAt` alone);
  `src/input/seam_turn.ts` (`dirGap`, `easedDir`, `seamTurnPace` / `Holds` / `Step`, `poleYawKept`, `tiltLeavesNow`, `seamWholeRad`). No place yet
  (`Scene_0bis`'s whole zone, the first frame): `turnAngles`, as before. 25 vectors, red on 28 mutants; **1933 vectors**.
  ⭐ **The auditor's find** (the app, `Scene_1`'s top, a fast dy onto it): the eased direction ran on the camera turn's share, whose angle (1.2°) has
  nothing to do with the direction's gap (7.7° — the spring's lag behind the finger): the turn whole in one frame, the gap's rest in the next — 9.1°
  of view in a frame. Now ONE clock over the SUM of the two (`seamWholeRad`, `turnWhole`).
  **The gates** — replays against 2.4b's: off, `Scene_1` and `Scene_0bis` identical bit for bit, `Scene_0` within 6 × 10⁻¹⁰ m (the replay's own
  noise, from frame 3); on, `Scene_0bis` the same play (≤ 3 × 10⁻⁹ m), `Scene_1` and `Scene_0` another play from the first close-in tilt (frame
  1133), no error, the view's largest turn in a frame 14.2° / 15.4° (14.9° / 15.4° before), none over 20°. **In the app, close in, before → after**:

  | | `Scene_1` | `Scene_0` |
  |---|---|---|
  | the orbit's angles against the map's, at rest | up to 23° apart → 0.00° | up to 26° → 0.00° |
  | the gizmo's step while a camera turn runs | 28 mm → 0.0 mm | 28 mm → 0.0 mm |
  | the largest roll in ONE frame | 6.3° → 6.2° | **180°** (leaving the tilted bottom) → 6.3° |
  | the largest view turn in ONE frame | 6.3° → 6.7°; ⚠ the tilt's entry under a fast dy 5.7° → **8.5°** | 11.2° → 6.4° |

  ⚠ **For the session on the tilted pole close in**: that entry — the piece's spring, 30 ms behind a fast finger, is set onto the new angles and its
  lag eased at 360°/s (two frames) with the camera following the piece; before, the lag was kept and caught up by the spring itself. ⚠ **A new
  camera turn, by design**: the tilt left by distance (or a zone's switch) with the gizmo on the FAR half of a cap turns the camera round to the
  place's own side — before, the camera stayed and the gizmo's angles disagreed (report 4 of §11). The ridge's crossing (2.4b) re-run: unchanged.
* **2.4e** (2026-11-15, `e14a2f0`, an Opus agent; audited by Fable, one completion `2fdbd34`), under `chartLayout` 1 AND `chartCalm` 1:
  `CalmKnobs.ownRun` (`calmRules(…).ownRun`) — a vertical facet's vertical share and its reading's weight on its OWN run along `b`, as a slanted
  one's; and (the auditor's) the vertical share whole BY POSITION toward both own ends of every side facet (`wholeEnds` → `poleEdgeWhole` — as
  built: the column's outer ends alone). 12 vectors, red on 12 mutants; **1942 vectors**. **The gates**: off, `Scene_1` and `Scene_0` identical
  bit for bit, `Scene_0bis` within its noise; `chartLayout` 1 alone: the three identical bit for bit; in the app, `Scene_0bis`, both switches on,
  far out, a steady finger from the rectangle onto the triangle — the view's largest turn in a frame **8.1° → 6.3°** (the eased target alone: it
  lags the finger, the edge zone crossed in 3 frames against 120 ms) **→ 4.9°** (by position), the way back 4.0° → 3.6°, the roll 4.8° → 2.8°.
  ⚠ **`Scene_1` and `Scene_0` change too with `chartCalm` 1** (the gizmo's path identical to 10⁻⁸ m, the VIEW up to 0.5 m of camera, ~4°):
  the old reference was the placed parts' BOX — on `Scene_1` 0.566 m high (parts proud of the top and under the bottom, 41 mm each) against the
  side faces' own 0.483 m — so the old share was never whole at a side face's own edge there either. ⚠ The bounce's rule (2026-11-04) is replaced
  under `chartCalm` 1 only; its cost on walls of unequal extents is in `calmTarget`'s comment — the owner's to review (§12.2).

### 12.2 The decisions taken while the owner slept (2026-11-15 → 16), and where the next session starts

The owner: *"I will go to sleep. Finish everything tonight without asking me anything. Just record your decisions so I can review tomorrow morning.
Tomorrow, we will work on the tilted-pole orbit at close in and the hysteresis."* → the list, each with its reason and what undoes it:
[`RND5.md`](../../00_CORE/queue_notes/RND5.md), "DECISIONS TO REVIEW". ⭐ **The next session**: the tilted pole close in (step C,
§10.1 — it now runs on the one transition; the entry's 8.5° frame of §12.1's table is the first thing to look at) and the hysteresis (2.4d: ONE
banded reading of the face under the gizmo, `faceSwitches` / `gizmoEdgeMarginMm`, for the tilt's entry and exit, the pole's crossing and the
square camera's target — §10.2's table lists what has a band today). ✅ Deployed 2026-11-16 (the owner: *"deploy"*): main `902ae88`.
* **2.4d** (2026-11-16, `42a408a`, an Opus agent; audited by Fable), under `chartLayout` 1: ONE band, `gizmoEdgeMarginMm` (5 mm ON THE MODEL), in
  two forms. `bandedFacet` (`src/input/face_band.ts`, `st.asmFaceBand`): the facet kept while the place is within the band of its polygon, read once
  a frame where `asmShown` is set, afresh at every change of frame — it feeds the square camera's target. The tilt: IN AT THE EDGE (its entry
  unchanged — the owner's rule of 2026-11-10), OUT ONE BAND PAST IT (`onTiltedFacet`'s tolerance), as `zoneAt` and the latch by distance already are.
  ⛔ Not banded, on purpose: the pole's crossing (its trigger is the finger's own push, the hold follows), the calm (eased, whole at an edge), the
  spit's side (§12.3). 18 vectors, red on 22 mutants; **1960 vectors**. **The gates** (`Scene_1`, close in, the place wobbling across an edge for 240
  frames — the session's `edge_noise.mjs`): the top edge, ±2.5 mm — the tilt made / left **21 → 0**, the view turned **1 188° → 0°**; a vertical
  edge, to 2.9 mm past it — the square camera's target **20 → 0**, the view **600° → 0°**; a crossing deeper than the band still makes and leaves the
  tilt. Off: `Scene_1` and `Scene_0bis` identical bit for bit, `Scene_0` within its noise; on: `Scene_1` identical, `Scene_0` and `Scene_0bis`
  another play from drag 17 (no frame over 20° of view; the roll's largest 14.6° → 17.9° on `Scene_0`, 26.9° → 21.0° on `Scene_0bis`). ⚠ Its cost:
  a tilt's real exit, and the square camera's turn at an edge, come 5 mm past the edge. ⚠ Not measured: `blendCrossed` and `squareTurning` start one
  band later too.

### 12.3 The owner's look on step 2.4 and the two comments (2026-11-16)

*"looks on pc and mobile look good. OK with two comments"* (main `902ae88`: P, 2.4a – 2.4c, 2.4e). **1.** The hysteresis must not forget *"faces
where the camera tilts when the gizmo crosses the middle (for example in scene 0bis, when coming from a triangle to the bottom face around the middle
of the bottom face, noise can send the gizmo on one half or the other half of the bottom face and the camera keeps tilting)"* — ⭐ reproduced with a
straight finger and NO noise, in the game before the charts too: the spit's finger mapping and its heading change in the middle of that face. It is
structural, not a missing band (the side's own band is ≈ 8 mm there): NOT patched at 2.4d →
[`TILTED_POLE_CLOSE_IN.md`](TILTED_POLE_CLOSE_IN.md) §4.1. **2.** The tilted-pole orbit close in: *"do the same as what we have done so far"* — its
rules, the obstacles and their fallbacks, one design from what others solved, the audit → that study (PROPOSED: seven decisions are the owner's,
nothing built). ✅ 2.4d deployed 2026-11-16 (the owner: *"Deploy"*): main `f1e03d3`; its look owed.
