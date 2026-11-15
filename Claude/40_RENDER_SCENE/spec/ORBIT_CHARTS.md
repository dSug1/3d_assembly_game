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
way delays a zone switch by a frame; a silent side change clears a hold): the tilt, the zone, the spit's side. The scene state holds 50 `asm…` fields,
about half of them history (latches, clocks, last-frame values). ⭐ The build's first act on the wiring (step 2.1) is the INVENTORY of those fields:
which are cached geometry (kept, read from the atlas), which are the transition's (one set), which go.

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
| the edge blend, the glides of a depth step | the wiring, after the map (`blendThroughEdges`, `gizmoGlide`) | nothing: they read the same columns and bounds |
| **a void's mouth** (open up the facet to its edge) | the gizmo held (`mouthHold`), then handed over BY THE AUTOMATIC TILT | ⛔ **coupled**: the hand-over is a change of frame |

* ⛔ **Step 2.4 must carry the mouth over**: the tilt's trigger becomes the one transition (§4.1), so the mouth's hand-over — and every rule keyed on
  "a face holding a pole" (`holdsPole`: a side facet beyond 45°; the tilt's virtual pole) — becomes a trigger of that transition. Step 2.1's inventory
  lists these paths beside the `asm…` fields, each with the map fields it reads.
* **The gate that they still behave**: `Scene_1` carries grooves, a channel and a mouth — its replay, from step 2.1 on.
* ⛔ **Not measured**: the charts' kinds on a real scene's contour other than a box and the heptagons — `Scene_2`'s, at each seat. Before step 2.4:
  one headless pass listing its contour and its faces' kinds at every seat (a heavy job: the owner's go). A slanted part large enough to pass D5
  becomes a facet and changes the contour (today too); the charts then treat it as any shape.
* What the "surface" of an assembly is stays PARKED (the owner).

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
| **1.3** | `ring_chart.ts` (new): the RINGS place and its way back | the same |
| **1.4** | `orbit_calm.ts`: the continuous share, the rule for every face — pure, not wired | the same; identical to today on `Scene_1`'s runs |
| **2.1** | the wiring reads the atlas, set to reproduce today (the built scale, today's frames); the `asm…` inventory (§4.2) and the specificities' paths (§4.4) | the same replay on `Scene_1`, `Scene_0`, `Scene_0bis`, number by number (`replay_probe.mjs`) |
| **2.2** | step A on (§5.2) | `Scene_1` unchanged; walks; the owner's look on `Scene_0` |
| **2.3** | the calm on every face (§5.1) | `Scene_1` unchanged; the owner's look on `Scene_0bis` |
| **2.4** | the charts take over the changes of frame, one mechanism at a time: the zone's detector, then the tilt's, then the one transition (§4) | replays, walks, the owner's look after each |
| **2.5** | the old detectors and their state deleted | a replay proving nothing changed |
| **3** | Fable's audit of the whole diff; the docs; then step B's offline round (§5.3) | the owner's look |

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
