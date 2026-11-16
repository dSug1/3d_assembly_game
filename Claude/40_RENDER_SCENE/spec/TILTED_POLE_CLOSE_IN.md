# THE TILTED-POLE ORBIT — its rules, its obstacles, one design for any geometry, the audit (2026-11-16)

> **STATUS** · ⛔⛔ **A STUDY — PROPOSED, NOT APPROVED, NOTHING BUILT.** The owner (2026-11-16): *"do the same as what we have done so far, i.e.:
> formulate properly the rules of what this tilted pole orbit is trying to achieve … identify what geometry and topology obstacles need to be overcome,
> where they can be overcome and where they cannot and require a fallback (the "polar zone" equivalent, made more systematic than our empirical design) …
> design a systematic way to achieve the rules on any geometry, based on what Blender or others have solved … audit the scripts and code we have built
> and identify weaknesses"*. **OWNS** · step C of the charts' rebuild ([`ORBIT_CHARTS.md`](ORBIT_CHARTS.md) §10.1) · **READ IF** · you touch the tilt, the
> square camera, a zone's camera or any trigger of a camera turn · **THE OWNER'S DECISIONS** · §5 — nothing is built before them.

## 0. In one page

* **What it is for** (§1): close in, EVERY face is orbited the way a side face is — the camera square to it, the green and the red straight, level and
  upright on the glass, the gizmo going the finger's way — including the faces where an upright camera cannot do it by itself: the faces holding the poles.
* **The obstacle** (§2): a camera that stays upright has no heading where it looks along the vertical. On a closed shape that cannot be removed, only
  MOVED. The polar orbit leaves it in the middle of the top and the bottom (rings and spokes there); the tilted pole moves it to the face's CORNERS and
  pays for it by a camera turn at some of its EDGES.
* **The design** (§3), one rule: **carry the heading across a face where upright means nothing (a FREE face), anchor it to gravity on every other face
  (a BOUND face), and pay the difference as ONE camera turn at the edge where the two meet.** Entering a free face costs nothing; leaving it costs 0°
  (the way back), a quarter (a side), a half (the far edge, with the dy hold). Nothing ever happens in the middle of a face.
* **What others do** (§3.5): it is the published rule of Autodesk's ViewCube — *"we use the local up model when moving to the top or bottom faces, and the
  global up model in all other cases"* — and, as geometry, a frame field whose singular points sit on corners (the theory behind Blender's quad remesher).
* **The audit** (§4): today the one obstacle has THREE families of code — the tilt on gravity's caps close in, the spit's side under / over a body, the
  polar limit far out — each with its own trigger, turn and hold. ⭐ **The owner's comment on `Scene_0bis`'s bottom face is the second family failing**:
  measured, it is not noise (§4.1).
* **Asked of the owner** (§5): seven decisions. The two that shape the build: the layout kept until an EDGE (never dropped by distance), and the spit's
  level faces on the same rule (no turn in the middle of the bottom face).

## 1. THE RULES — what the tilted-pole orbit is trying to achieve

Collected from the owner's words as the documents record them (`POLAR_ORBIT_CLEANUP.md` §9, `TILTED_ORBIT_REBUILD_SCOPE.md` §4 and §7,
`ORBIT_ANY_SHAPE.md` §8, `POLAR_ZONES.md`, [`ORBIT_CHARTS.md`](ORBIT_CHARTS.md) §10 – §12). Each is the rule as I read it; the quote beside it is the owner's.

| # | rule | the owner |
|---|---|---|
| **T1** | **Every face like a side face.** Close in, on the face under the gizmo: the green and the red straight, square to each other, level and upright on the glass; dx along the green, dy along the red, the gizmo going the finger's way | *"the orbit tilts so the face currently holding the gizmo becomes the one with the red and green sections which are perpendicular"* (2026-11-09) · *"sections always plane and horizontal/vertical … same direction of gizmo and delta position input"* (2026-11-03) |
| **T2** | **The camera square to that face** close in — no calm there | *"on orthogonal red-green sections, we already have a mechanism to cross the edges and the calm is not required"* → the square camera *"the way forward"* (2026-11-10) |
| **T3** | **The gizmo stays.** A change of layout never moves the gizmo; the sections are recomputed from where it is; a relocation only where the new lines put it elsewhere, eased | *"at the moment the camera tilts the gizmo stays where it is but the red and green sections are recomputed"* (11-09) · *"make the jump smooth (same as the camera tilt)"* (11-10) |
| **T4** | **The edge is the only trigger.** A camera turn that changes the layout happens as the gizmo crosses an edge — never in the middle of a face | *"the camera roll is performed when the gizmo reaches the limit edge at the end of the face, not in the middle of the face travel"* (11-04) · *"simply keep the edge, and not use any stretch"* (11-10) |
| **T5** | **One turn, and it completes.** One speed, irreversible, the gizmo held while it runs | *"once the tilt starts, it cannot be rolled back … and shall complete"* · *"one speed for every tilt"* (11-10) |
| **T6** | **Upright where upright means something.** On every face that is not level the world's vertical is up on the glass; never upside down | *"the camera roll shall keep the scene upside up if the face is not purely horizontal"* (11-04) · R4 KEPT (11-13) |
| **T7** | **No surprise at an entry.** Entering a face needs no turn when a layout continuing the view exists; the turn is paid at the exit that needs one | *"If the gizmo crosses the edge … towards a face which would result in the scene upside down or slanted, the camera tilts when the gizmo crosses the edge so that the verticality on the next face is restored"* (11-09) |
| **T8** | **Once per face, close in.** A layout taken on a face is kept until the gizmo leaves that face — or the piece backs out past the close-in distance (D-T1) | *"my new rule allows to convert a polar red-green face to a perpendicular red-green face once, until the gizmo crossing edges requires the polar orbit to realign its poles"* (11-09) · *"the tilted pole orbit is reserved for close in … The close in square is for fine placement of the piece, not for scene view"* (11-16) |
| **T9** | **The half turn's price.** After a half turn the dy that crossed is held until the finger reverses; the hold ends with the gesture | *"the dy upwards is blocked until a certain band is reached in the face beyond but dx and dy downwards are allowed"* (11-12) · *"there are times I cannot reverse"* (11-14) |
| **T10** | **The approach is not disturbed — on the way in nor on the way out.** Made during the approach, the layout changes the sections at once and the camera waits, then blends by the finger's first millimetres; backing out, the camera's way back to the orbit is blended too (§8) | *"the red-green sections automatically switches to orthogonal … but the camera view waits through the approach"* (11-11) · *"Find a way to blend properly the camera movement on the way out"* (11-16) |
| **T11** | **No noise into the camera.** Every trigger of a camera turn has a band | *"hysteresis where needed … so that input noise does not transfer to camera movement"* (11-15) · the middle of `Scene_0bis`'s bottom face (11-16) |
| **T12** | **Any geometry, one way.** The same rules on every shape; where a rule cannot hold, a stated fallback — never a case-by-case patch | *"analyze the deep root cause, don't patch with fix which may conflict with other rules"* (11-15) |

The charts' rules stand above these and in their order ([`ORBIT_CHARTS.md`](ORBIT_CHARTS.md) §1): Landing, Continuity and Upright never yield; then Finger;
then Sections; a camera turn at a crossing and a short hold are the price of straight sections. T1 – T12 say WHERE that price is paid.

⚠ **Three places where the owner's own rules pull against each other** — to settle in §5, not to patch:

1. **T8 against the distance switch.** *"if the piece crosses the hysteresis threshold, the tilt automatically triggers on or off"* (11-10) drops the
   layout in the MIDDLE of a face when the piece backs out past 0.65 m — a camera turn with no edge (T4), up to a half turn. ✅ **Settled by the
   owner (D-T1, 2026-11-16): the distance switch STAYS** — the tilted pole is for close in only; what must change is HOW the camera goes back (§8).
2. **T9 across gestures.** The hold ends with the gesture, so a new gesture pushing the same way crosses the far edge again — the loop the hold was
   made to stop, once per gesture (`RND5.md`, decision 4).
3. **Far out.** With the press gone the tilt is close in only: far out a face holding a pole is polar and its middle is the orbit's limit (D-C6) — except
   in a spit zone, where the orbit runs on under the body and a turn must happen somewhere (§2 O10).

## 2. THE OBSTACLES — geometry and topology

### 2.1 The one obstacle, and why it cannot be removed

Give every point of the shape's surface the direction "up on the glass" of the camera looking square at it. With an upright camera that direction is
the uphill one — and it does not exist where the surface is level: there every heading is equally upright. On a closed shape such a field of directions
MUST have such points, and their strengths add up to exactly two full turns' worth (the "hairy ball" theorem; counted on a mesh it is the 720° of
[`ORBIT_CHARTS.md`](ORBIT_CHARTS.md) §1 — a cube's eight corners, 90° each). No design removes them. A design chooses where they sit:

| where the turn is put | what the player sees | who does it |
|---|---|---|
| **a point in the middle of a face** | rings and spokes round it; a dx there spins the picture; the place is a limit | the polar orbit on a top face (gravity's chart, D-C6) |
| **a line across a face** | the picture flips as the gizmo crosses a line nothing marks | the spit's "side" today (`Scene_0bis`'s bottom face — §4.1) |
| **the face's corners, paid on its edges** | every face straight and square; a camera turn at some edge crossings | the tilted pole on the cube's top |
| **nowhere fixed — it follows the path** | no pole, but the picture drifts off upright with every loop | a trackball; the facet frames of 2026-11-05 (*"full of bugs"*: 12 of 13 upside down) |

The third row is the only one that satisfies T1 and T4 together, and it is available **only on a face where the upright rule does not bind** — a face
the camera looks at along the vertical. Hence the two kinds of face this study rests on:

* **BOUND** — the face is not level: the upright camera has one heading on it, and gravity's layout (the green level, the red up the slope) is already
  straight and square there. Nothing to tilt. A roof's two faces, a pyramid's, every side face.
* **FREE** — the face is level: square to it the camera looks along the vertical, every heading is upright. A layout must be CHOSEN — that choice is the
  tilted pole.

### 2.2 The obstacles one by one — overcome, or a fallback

| # | obstacle | can it be overcome? | how, or the fallback |
|---|---|---|---|
| **O1** | **The layout on a free face depends on the way in** (carry a cross round a corner: it comes back turned by the corner's angle) — four layouts on a rectangle | not removable; it IS the obstacle of §2.1 in small | accepted as the design's ONE piece of memory: the heading carried on the current free face (§3.2) |
| **O2** | **Leaving a free face costs a turn that depends on the edge**: none back over the edge it came in by, a quarter by a side, a half by the far edge | not removable (the turns round each corner add up to its angle) | paid at that edge as ONE timed turn, the gizmo held (T4, T5); computed, never tabulated (§3.3) |
| **O3** | **The half turn** — upright, never blocked and "dy keeps its way" cannot all hold where height ends | no | the turn and the dy hold (T9) — the cube's far edge, a ridge, a spit's far edge: ONE event |
| **O4** | **An entry with no edge** — the piece brought close in while the gizmo already stands on a free face; a pick-up; a seat | no edge to read the layout from | the layout nearest the heading shown; the sections at once, the camera waiting then blended by the finger (T10) |
| **O5** | **A corner** — two entry edges within the band of each other | yes | ONE banded reading of the face under the gizmo decides which edge was crossed (step 2.4d); the layout is decided at an entry only, never again on the face |
| **O6** | **A free face that is not a rectangle** (a triangle, a heptagon's end, a disc) — no layout is square to all its edges | partly | the layout square to the ENTRY edge: the sections still straight, square and upright; the other edges lie slanted on the glass and their exits turn by their own angle (51°, 103°, 154° on a heptagon) — or polar, as D-C2 has it today |
| **O7** | **A level face that is nearly a point** — a fan of small faces round an apex, the tip of a cone, a dome | no: the turns per millimetre grow without bound toward the apex | **the polar zone** — rings and lines into the pole about the fan's own axis (the owner: *"if the faces contour is small and many faces converge to a singularity, polar orbit shall be the only way"*); under the charts: the FAN kind, then RINGS |
| **O8** | **A slanted face holding the pole** (a roof) | nothing to overcome: it is BOUND, gravity's layout is straight on it | no tilt (D-C4); its top edge is O3's event. ⚠ Entered from a gable end it is BENT (the red not square to that edge) — the price of T6 on a slanted face |
| **O9** | **A free face too small** for a layout to mean anything — narrower than the band, or than the hold's depth | no | below a size (the contour's own rule: a face under a quarter of its polygon is not a face, D5) it is part of its neighbours — no change of layout on it |
| **O10** | **The vertical view in another frame** — a zone whose axis is not gravity's. Held by the WORLD's vertical (a spit), the body's level faces are free faces exactly as a cube's top is; and there the orbit does NOT stop at them, it runs on under the body | yes — it is the same obstacle | the same rule (§3.4). ⛔ Today: a different mechanism, which puts the turn on a line across the face (§4.1) |
| **O11** | **A concave edge** — a level floor meeting a wall that rises from it (a channel, a step) | yes, and it is cheap: the wall faces the camera, its upright view needs NO turn | falls out of §3.3's computation (the far edge of a floor against a rising wall: 0°; against a falling one: 180°) — ⛔ today the special case of the "mouth", path-dependent |
| **O12** | **Close in against far out** — the square camera and the layouts exist within 0.6 m only (the owner, D-T1: for fine placement, not for the scene's view) | a choice, made | backing out past 0.65 m the polar orbit is back; the camera's way there is blended, never a timed turn under a moving approach (§8) |
| **O13** | **Occlusion, collision** — square over a floor between walls the camera or the piece may not fit | no | as today: the piece stops where it touches (*"it is normal the orbit gets blocked if the piece collides"*, 2026-11-09) |

## 3. THE DESIGN — the carried heading

### 3.1 The rule

> **Carry the heading across a FREE face. Anchor it to gravity on every BOUND face. Where the two meet — an edge — pay the difference as ONE camera
> turn.**

It is the owner's rule of 2026-11-09 with its three blanks filled: WHICH faces (the free ones, in whatever frame holds the camera — not "the top and
the bottom"), WHICH layout (the one that continues the view the gizmo came in with), and WHAT each exit costs (computed from the edge, for any polygon).

### 3.2 The model

* **The holding "up"** of the frame the orbit is in: the world's vertical for gravity's chart and for a zone held by the world (a spit); the zone's
  axis for a zone held by its axis (an upright zone) — [`ORBIT_CHARTS.md`](ORBIT_CHARTS.md) §2.5, unchanged.
* **A face is FREE** when its normal is that "up" (within the cap's tolerance, 1° today); else it is BOUND. Computed with the atlas at each seat, per
  frame — the list replaces "the cap of gravity's chart" as the place where a layout is chosen.
* **A BOUND face's layout** is its chart's, as built (the charts' CELL, FAN, BENT kinds).
* **A FREE face's layouts**: for each of its edges, the frame in which that edge is level and the face is a CELL — on a rectangle four (two crosses,
  each two ways up), on any polygon one per edge. Computed for every cap since step 1.2 (`assignCharts().layouts`).
* **The memory** — one item: on a free face, the HEADING `h` it was entered with (the layout in force). No other state: the gizmo stays a function of
  the chart's two angles in that layout's frame, as on any face.

### 3.3 The transitions — every one "the one transition" of step 2.4 (the frame at once, the gizmo kept, every angle set, one camera turn)

| the crossing | the layout taken | the camera's turn |
|---|---|---|
| a bound face → a FREE face, over an edge | the layout of THAT edge whose heading is the bound face's own "up" UNFOLDED across the edge (over a side's top edge onto a top face: away from that side; down onto a bottom face: back toward the face just left) | none on the glass (the square camera pitches over the edge, as at any edge) |
| a FREE face → a bound face, over an edge | the bound face's own | the angle between the heading carried and that face's "up" unfolded across the edge: **0°** back over the edge the gizmo came in by, **90°** at a side, **180°** at the far edge — any angle on another polygon. ⭐ A wall RISING from a level floor (a concave edge) unfolds the other way: the far wall costs 0° |
| the turn is over 90° and the finger's dy was pushing the gizmo out over that edge (§10) | — | **the dy hold** on that dy (it would bring the gizmo straight back): the finger must reverse. ⛔ Today the hold is set from 120°, on the finger's last dy sign whatever it was (§4 W6) |
| an entry with no edge (O4) | the layout nearest the heading shown | at most half the angle between two layouts (45° on a rectangle); the camera waits, then blends by the finger (T10) |
| bound → bound | each its own | the square camera's turn about the edge — as built |

One banded reading of the face under the gizmo feeds every row (step 2.4d: built beside this study).

### 3.4 The same rule in a zone — what replaces the spit's "side"

In `Scene_0bis` the whole body is a spit zone: its axis level, the camera held by the world. Its bottom face is level — a FREE face with four edges:

* **entered from a neighbouring rectangle** (a dy round the axis): the layout with the axis ACROSS the glass. The gizmo crosses the face; at the
  opposite long edge — the far edge — the half turn and the hold. ⛔ Today the half turn is at the face's MIDDLE.
* **entered from a tip's triangle** (along the axis): the layout with the axis UP the glass — the picture keeps the way it had on the triangle. A dx
  to a long edge is a side exit: a quarter turn there. ⛔ Today the picture turns a quarter while the gizmo is still on its way in, to the left or the
  right by which half of the face the gizmo is on, and the finger's two axes are swapped under it (§4.1).

The ridge at the top is O3's event at an edge, as built. ⚠ **Far out** the camera is not square to the face (it looks at the centre, eased by the
calm), so carrying the heading to the far edge shows the last part of the face with the world's vertical pointing DOWN on the glass (by the sine of the
view's angle off the vertical — 0.43 on the heptagon). Two variants, to prototype (§6) and to judge by eye:

* **N1** — on a free face the camera is square to it at every distance (the calm whole on its normal): every turn at an edge, never off upright; the
  orbit over that face becomes a pan.
* **N2** — the calm as built, the heading carried: softer, off upright in the edge zone before a far edge.

### 3.5 What others have solved, and what is taken from them

| who | what they do at the vertical view | taken |
|---|---|---|
| **Autodesk ViewCube** (Khan, Mordatch, Fitzmaurice, Matejka, Kurtenbach, I3D 2008 — read 2026-11-16) | *"To minimize extra rotations when moving from one viewpoint to another, we use the local up model when moving to the top or bottom faces, and the global up model [Khan et al. 2005] in all other cases."* On a face view, arrows roll the view a quarter turn | exactly §3.1: carry on the free faces, gravity elsewhere; a rectangle's four layouts |
| **HoverCam** (Khan, Komalo, Stam, Fitzmaurice, Kurtenbach, I3D 2005) | a camera that follows the surface close in and turns at its edges; the "global" and "local" up models the ViewCube paper cites | the vocabulary. ⛔ Its closest-point surface following is NOT used: the gizmo is the face map's function of two angles (and see the patents below) |
| **Blender** — the numpad's Top view | ONE fixed layout for the top, whatever the view before: the turn is paid on the way IN (up to a half turn) | the alternative to carrying — refused here by T7 (no surprise at an entry), kept as the fallback if the patents below bar the first row |
| **Blender / three.js turntable** | the pole is a limit (three.js clamps the polar angle) or is passed upside down | D-C6 far out |
| **Trackball / arcball** (Shoemake 1992) | no pole; the roll drifts with the path | refused (T6) — it is §2.1's fourth row |
| **Frame fields for quad meshes** (Bommes, Zimmer, Kobbelt 2009; Instant Meshes 2015; QuadriFlow 2018 — Blender's quad remesher) | a cross on every face, smooth across edges but for a turn by a multiple of 90° on chosen edges; the singular points on corners; their strengths sum to the shape's count | the proof that §2.1's third row exists on any polyhedron, and its bookkeeping: the turn of each edge is DATA computed with the atlas. No algorithm is needed — the shapes have tens of faces |
| **Parallel transport** (the owner's own D1, 2026-11-04: *"the angle between the normals … projected in the plane orthogonal to the edge"*) | carry the frame over every edge by unfolding | carried ONLY across free faces. Carried everywhere it drifts off upright with the path — that is why Step 6 failed (2026-11-05) |

⚠ **Patents — the owner's to judge** (the standing rule: patent-free methods only). Autodesk holds US 7,782,319 (the ViewCube widget) and US 8,044,953
(HoverCam: surface following with a blending layer near the surface). This design uses neither a cube widget nor closest-point surface following, and
"keep the view's up when moving to a top view" is an old practice of every CAD viewer — but I am not able to say what those claims cover. If in doubt:
the Blender row (a fixed layout per free face, the turn on the way in) is free of the question, at the cost of T7.

✅ **The owner's reading of US 7,782,319 B2 (2026-11-16, D-T7)**: *"Scope of Protection: The independent claims of US7782319B2 are drafted broadly around displaying a 3D representation of a scene's coordinate system (such as a cube with faces, edges, and corners), manipulating that representation to select a viewpoint, and reorienting the 3D scene accordingly. If a widget already infringes the broader claims of US7782319B2 (by using a clickable/draggable 3D cube controller), using this local-up/global-up transition falls within that infringing system. Conversely, if a navigation tool avoids the claimed 3D cube widget structure altogether (e.g., using a simple 2D axis tripod or standard viewport hotkeys), using a local-up/global-up camera interpolation rule on its own is standard 3D graphics math disclosed in the specification rather than a standalone claimed monopoly."* → **the carried heading stands** (the game has no such widget: the
gizmo is a mark on the assembly's own surface, the view is never chosen by touching a picture of the coordinate system). ⛔ **The condition that goes
with it: the game never shows a clickable or draggable 3D orientation widget** — a cube, or any representation of the scene's coordinate system used
to pick a view. ⚠ This reading is about US 7,782,319 alone; US 8,044,953 (HoverCam: a camera that changes from free motion to surface following as
a surface is approached, blended in a layer near it) is not covered by it — the design uses no closest-point surface following, but the close-in
square camera (live since 2026-11-10) is the nearest thing the game has to that description: the owner's to judge if he wishes.

### 3.6 The two ways of choosing a free face's layout, compared (for D-T7 — drawn in the artifact page)

On the cube's top face, its four edges named after the side faces they border:

| | **Autodesk's ViewCube — keep the way up you arrive with** (the carried heading, §3.1) | **Blender's Top view — always the same way up** (a fixed layout) |
|---|---|---|
| what the glass shows | the edge the gizmo came over is at the BOTTOM of the glass: up the front, the front edge is down; up the right side, the right edge is down | the same side at the bottom whatever the way in (say the front) |
| on arrival | never a turn | none from the home side; a quarter turn from either neighbour side; a half turn (and the hold) from the opposite side |
| on leaving | 0° back over the edge it came in by, 90° by a side, 180° and the hold by the far edge | 0° over the home edge, 90° over its neighbours, 180° and the hold over the opposite one — whatever the way in |

| the trip | Autodesk's way | Blender's way |
|---|---|---|
| up the front, across the top, down the back | no turn in · a half turn out, then the hold | the same |
| up the right, back down the right | no turn at all | a quarter turn in · a quarter turn out |
| up the right, across the top, down the left | no turn in · a half turn out, then the hold | a quarter turn in · a quarter turn out |
| up the back, back down the back | no turn at all | a half turn in, then the hold · a half turn out, then the hold |

* **The same in both**: every turn happens at an edge, never in the middle of a face; both remove the turn in the middle of `Scene_0bis`'s bottom face.
* **The difference**: the first never turns the picture on arrival, and going onto a face and back off the same way costs nothing; the second always
  shows a face the same way round (predictable), but arriving from three sides out of four turns the picture. On `Scene_0bis`'s bottom face the
  second would turn the picture a quarter at the rim edge when coming in from a tip.
* **What the game does today**: the tilted pole on the cube's top, close in, already behaves the first way (built 2026-11-10: the layout follows the
  side the gizmo came up, the exits cost 0°, 90° or 180°).
* ✅ **Chosen** (D-T7, the owner, 2026-11-16): the first way, on his reading of the patent's claims — above.

## 4. THE AUDIT — the code and the scripts against §2 and §3

### 4.1 Measured first: the owner's comment on `Scene_0bis`'s bottom face is structural, not noise

The owner (2026-11-16): *"in scene 0bis, when coming from a triangle to the bottom face around the middle of the bottom face, noise can send the gizmo
on one half or the other half of the bottom face and the camera keeps tilting"*. Reproduced headless (the session's `mid_check.mjs`; far out; ONE drag,
a perfectly straight finger, no wobble; the gizmo started on the triangle under the +x tip):

| run | started | what happened |
|---|---|---|
| both switches on | 2.6 mm off the middle | the gizmo veered ACROSS the middle (−5 → +62 → +79 mm), the side changed, the half turn ran (the picture turned ~240° on the glass, 334° of view in all), then the dy hold blocked the rest of the drag — 308 frames of finger moving nothing |
| both switches on | 31 mm off, the other half | the same, mirrored (+31 → −94 mm; 222° in all; blocked 310 frames) |
| switches off (the game before the charts) | 42 mm off | the same (+42 → −73 mm; 330°; blocked 309 frames) |

**The cause, read on the frames**: coming in from the tip the body's axis lies UP the glass and the finger's dy runs along it. As the view passes 60°
of pitch (`SPIT_CROSSING_PITCH_RAD`) two things switch on together: `zoneFinger` swaps the finger's axes (`fingerSwapped` — written for the axis ACROSS
the glass: the dy now goes ROUND the axis, sideways) with a sign read off an angle that is then near zero, and `spitCameraHeading` starts turning the
picture a quarter toward the side the gizmo is on. The gizmo is pushed across the middle, the side flips (`spitSide`), and that is a crossing: the half
turn and the hold. ⭐ The side's own band (2° of the camera's direction ≈ 8 mm on that face) is already wider than the band of the quads — **a band is
not what is missing**: the heading rule itself changes in the middle of a face (T4), and the finger's mapping with it (T1).

**In plain words** (the owner asked, 2026-11-16: *"Explain your answer in layman's terms. What is the root cause? Which of our rules specifies that
behavior? Which other geometries are subject to the same?"*). Under the body the camera looks straight up at a flat face: there "upright" means
nothing, the picture could be held any way round. The game picks by which side of the body's centre line the camera is on; cross that line and it
spins the picture half a turn, then holds the finger's direction until it reverses. On `Scene_0bis` that line runs down the middle of the bottom
face, where nothing marks it. Coming in from a tip is worse: the picture arrives with the body's length UP the glass, the game wants it ACROSS,
starts turning the picture a quarter, and at the same moment switches what the finger's two directions mean as if the picture had already turned —
for a few frames "up" pushes the gizmo sideways, over the line. **The root cause in one sentence**: the place where the camera must turn round was
put on an invisible line through the middle of a flat face instead of at an edge, and the picture's orientation and the finger's mapping are both
switched by the camera's ANGLE (60°) instead of by an edge crossing.

**No rule of the owner's asks for a turn in the middle of that face** — it comes from how three of his rules were built together (the builder's
choices):

| the owner's rule | as built | the problem |
|---|---|---|
| in a spit the camera is never upside down (R4 KEPT, D-Z3, 2026-11-13) | the orbit runs all the way round the body, so the camera must flip each time it passes under or over it; the flip was put where the camera is exactly under / over the axis | on top that is the ridge — an edge; underneath it is the middle of a flat face |
| *"replicate the behavior of scene 0 when crossing the zenith edge"* (2026-11-13) | the half turn, the gizmo held, then the dy hold | right at the ridge; applied the same way at the bottom, where there is no edge |
| dx and dy swap in a spit (2026-11-13) | a hard switch above 60° of pitch, written for the body's axis lying ACROSS the glass | wrong when the gizmo arrives from a tip, the axis UP the glass |

It also breaks the owner's older rule (Q6, 2026-11-04): the roll at the limit edge, *"not in the middle of the face travel"*.

**Which other shapes**: spit zones only — a long body lying on its side whose ends taper to tips — and in them any level face straight under or
over the axis: a flat bottom or a flat top (the heptagon's bottom; a square or hexagonal bar with pointed ends has both; any even-sided faceted
shaft). A ridge there is an edge: the half turn is in the right place; ⚠ arriving along it from a tip probably veers the same way (not measured).
`Scene_1` and `Scene_0` are not spit zones: their top and bottom faces are the polar orbit's (the middle a point where the orbit stops) or the
tilt's close in. Later scenes with shafts, pins or cones lying on their side get it if the zones class them as spits.

### 4.2 Weaknesses — where the code does not address the obstacle, or patches it

| # | what | where | against |
|---|---|---|---|
| **W1** | **Three families for one obstacle**: the tilt (gravity's caps, close in), the spit's side / bias / swap / crossing (a zone held by the world), the polar limit with its three pitch blends (`poleWeight` 60 – 85°, `cameraHeading` 50 – 60°, the held zenith heading). Each has its own trigger, turn and hold; the half turn is written three times (`tiltOff` + `edgeHoldAt`, `poleCross`, `spitStep` + `crossingHold`) | `assembly_wiring.ts`, `polar_zone.ts`, `orbit_calm.ts` | T12 |
| **W2** | **The tilt refuses every zone** (`tiltOn`: `if (st.asmZone !== null) return`) and reads the WORLD map's cap: a zone's free faces have no layouts in the wiring (an upright zone's cap — *its layouts are computed; the wiring cannot use them*) | `tiltOn` | O10 |
| **W3** | **The spit's turn sits on a line across a free face**, with a 2° band, a 60° → 75° blend of the heading and a hard swap of the finger's axes at 60° whose sign is undefined when the axis lies up the glass | `spitSide`, `spitCameraHeading`, `zoneFinger`, `fingerSwapped` | T1, T4 — §4.1 |
| **W4** | **The way out by distance is a TIMED turn** (`tl.off` → `tiltOff`: one turn at 360°/s, the gizmo held) in the middle of a face, up to a half turn, while the approach is still going — the way IN waits and blends (T10), the way out does not | `assemblyFrame`, `tiltOff` | T10 — §8 |
| **W5** | **The layout is "the one nearest the heading shown"** (`capTiltHeading(…, yaw)`), not "the entry edge's". Equal on a box (each side face owns ±45° of yaw); nothing checks that they stay equal on another polygon, nor at a corner | `tiltOn` | O1, O5 |
| **W6** | **The hold is set from 120°** (`edgeHoldAt`: the exit face's level normal under −0.5 along the heading): an exit that turns the view between 90° and 120° (a heptagon's end face: 103°) leaves the dy free to bring the gizmo back over the edge it just crossed | `orbit_tilt.ts` | O2, T9 |
| **W7** | **A tilted frame's map is built in the WORLD box's turned corners** (`tiltBox`): for a layout off the world's axes the box is looser than the shape and the map's share test drops its faces (found at step 1.1: the map all virtual at 45°). Today's tilt cannot serve a layout that is not along x or z | `faceMapOf` | O6 |
| **W8** | **Close in on a cap that takes no tilt** (a level face that is not a rectangle, D-C2) the square camera has NO target (`squareFrame`: *"none over a cap … the automatic tilt comes next"* — it no longer always comes): the camera keeps looking square at the face it left | `squareFrame` | O6 — a loophole, no scene has it |
| **W9** | **The mouth** (a void open toward a pole): a hold that depends on the path, and a tilt made from a face the gizmo is not on (`asmMouth`, `mouthHold`) — the one place the gizmo is not a function of the place | `assemblyFrame`, `tiltOn` | O11 |
| **W10** | **Bands in five spaces** — metres of distance, millimetres on the model (5 and 10), millimetres of finger (30), degrees of camera (2), a micrometre tie — and two triggers with none until step 2.4d (measured 2026-11-16, close in on the cube, the place wobbling ±3 mm across the top edge for 4 s: the tilt made and left 21 times, the view turned 1 188°; across a vertical edge: the square camera's target 20 times, 600°) | throughout | T11 |
| **W11** | **A turn's first frame** — the tilt's entry under a fast dy turns the view 8.5° in one frame (5.7° before step 2.4c set the followers' states) | `seamRebase` | T5 — ✅ measured 2026-11-16 (C1, §12): not the rebase — two clocks in one transition (its turn and the square camera's pitch) and the direction's ease read too early; ⛔ NOT built, the options are the owner's |
| **W12** | **Fallbacks with holes** — a face no columns chart serves goes to RINGS, which is not wired (it stays on gravity's map: the leaps and stalls of a BROKEN face); a partial fan likewise (D-C5); a near-level roof entered from its gable is BENT at the entry (by T6 — to be shown to the owner on a test scene, not found by accident) | `orbit_charts.ts`, the wiring | T12 |

### 4.3 The scripts — what no run covers

* **The offline prototype never ran close in** ([`ORBIT_CHARTS.md`](ORBIT_CHARTS.md) §6: *not covered — the camera's path, the calm in motion, the square
  camera*). ✅ Since: §7 (the turns computed on the 35 shapes; the spit's bottom face modelled) — the close-in camera's PATH is still not modelled.
* **The replay** (the gate of every step) never arrives on `Scene_0bis`'s bottom face from a tip, never crosses `Scene_0`'s ridge close in, never rests
  on an edge. §4.1 and W10 were found by three probes written this session (`mid_check.mjs`, `edge_noise.mjs`, `tilt_check.mjs` — the session's scratchpad).
* **The walks** count jumps and rolls but have no rule for "a camera turn with no edge under the gizmo" (T4) nor "a finger moving, the gizmo not"
  outside the stated holds.
* **The vectors** pin the wiring by source strings in several places: they hold the code's shape, not its behaviour.

## 5. THE OWNER'S DECISIONS

| # | the question | recommended | its cost |
|---|---|---|---|
| **D-T1** ⛔ | Is a free face's layout kept until an EDGE — also when the piece backs out past the close-in distance (your rule of 2026-11-10 turns it off there)? | ~~Yes~~ — ⛔ **NO**, the owner, 2026-11-16: *"no, I would prefer to return to the orbit when the distance is crossed back (0.65m currently), so the tilted pole orbit is reserved for close in. I don't like to see the top of the scene square at far distance. The close in square is for fine placement of the piece, not for scene view. Find a way to blend properly the camera movement on the way out."* | the turn on the way out cannot be removed (the polar layout's pole is in the middle of the face): it is PACED — §8 |
| **D-T2** ✅ | Do a spit's level faces follow the same rule — no turn in the middle of `Scene_0bis`'s bottom face, the half turn at its far edge, the picture unchanged when coming in from a tip? | **Yes** — ✅ the owner, 2026-11-16: *"D-T2: agreed"* | the spit's side, bias and swap are replaced, not tuned; N1 or N2 far out (§3.4) is yours to judge on the device |
| **D-T3** ✅ | Far out on gravity's top and bottom faces: polar and a limit (D-C6, today), or the same rule far out too (a top face crossable by dy again)? | **keep D-C6** — ✅ the owner, 2026-11-16 (*"D-T2 to D-T7: agree with your recommendations"*) | far out stays as you accepted it (*"polar orbit far out: the sections are ok"*) |
| **D-T4** ✅ | The dy hold from any turn over 90° (not 120°)? | ✅ the owner, 2026-11-16: *"i have no particular opinion. Weigh the pros and the cons and build what is best"* → **decided by the builder (§10): the hold is set when the turn is over 90° AND the finger's dy was the one pushing the gizmo out over that edge — never on a dy that did not** | none on a rectangle (the far edge, crossed by its dy, as today) |
| **D-T5** ✅ | A level face that is not a rectangle: the layout square to its entry edge (a tilt), or polar at every distance (D-C2, today)? | **keep D-C2** until a scene has such a face; the design covers it — ✅ the owner, 2026-11-16 | W8's loophole is closed either way |
| **D-T6** ✅ | A new gesture pushing the same way crosses a far edge again (your rule of 2026-11-14). Keep? | **keep** — ✅ the owner, 2026-11-16 | one crossing per gesture |
| **D-T7** ✅ | The patents of §3.5 | ✅ the owner, 2026-11-16: the local-up / global-up rule on its own is not what US 7,782,319 claims (§3.5) — **the carried heading stands** | ⛔ never a clickable / draggable 3D orientation widget in the game; ⚠ US 8,044,953 not covered by that reading |

## 6. THE BUILD, IF APPROVED — steps and gates (each one agent run, audited; a look on the device closes it)

| step | what | gate |
|---|---|---|
| **C0** ✅ | run 2026-11-16 (§7) — **an offline round**, as for the charts: the free faces, their layouts and every exit's turn on the 35 shapes and on test scenes (a cube, a heptagon's end, an L-shaped top, a step, a spit body); a walker crossing every edge both ways — no turn without an edge, the turns round every corner adding up; N1 against N2 drawn for the owner | the tables; the owner's look at the drawings |
| **C1** ✅ | W11: the entry's first frame measured and its cause named — before anything is built on it. ✅ Measured 2026-11-16 (§12): structural (two clocks in one transition); ⛔ NOT built — the options A – D are the owner's (§12.4) | the probe |
| **C2** 🔧 | the pure part built 2026-11-16 (`c5538db`, an Opus agent, audited: `src/input/free_face.ts` — `freeFaces`, `freeEdges`, `entryHeading`, `nearestHeading`, `exitTurnRad`, `turnHolds`; equal to §7's reference on the 35 shapes; 53 vectors, **2013**; NOT wired) — free faces and their layouts in the atlas (pure, `src/input`); the entry by the edge; the exit's turn and the hold computed (W5, W6); the frame's map in the contour's box (W7) | vectors; the three scenes replay unchanged |
| **C3** 🔧 | built 2026-11-16 (`86f2cbe` + the auditor's completion; §8.1), audited, DEPLOYED 2026-11-16 (the owner: *"Deploy"* — main `40c6325`, both switches on by default) — THE WAY OUT BLENDED (D-T1, W4, §8): the camera's turn after the threshold follows the approach finger (`tiltOutBlendMm`), smooth, never over the one speed, the gizmo free; ⛔ the owner's look owed. W8 (the square camera's target on a cap with no tilt) NOT in this step: with a test scene | the way-out run ✅, the replays ✅ (§8.1) |
| **C4** 🔧 | built 2026-11-16 (`0125445`, an Opus agent, + the auditor's `28df70c`; §9.1), audited, DEPLOYED 2026-11-16 (the owner: *"Deploy"* — main `6685f8f`) — the spit on the same rule (D-T2, W2, W3): on a spit's level face the heading carried, the finger read off the picture, nothing in the face's middle, the half turn at the far edge; N1 / N2 behind `freeFaceSquare`; ✅✅ **the owner's look, 2026-11-16: *"This is good."*** | `mid_check.mjs`, `across_check.mjs` ✅; the replays ✅ (§9.1); the owner's records of 2026-11-14 not replayed |
| **C5** 🔧 | built 2026-11-16 (§13.3; ⛔ the spit's own trigger not, §13.4) — One half-turn event (W1), its hold from any turn over 90° (D-T4, W6); ⛔ the mouth as a concave edge (W9) MOVED (2026-11-16) into the study "before step B" below | the ridge and far-edge runs |
| then | step 2.5 of the charts (the old detectors and the switch deleted) | — |
| **before step B** | **the surface definition and the singularities** (voids, channels, mouths, protrusions, small faces) — the owner, 2026-11-16: *"Also, before step B, we will need to work on the surface definition and the singularities (voids, channels, mouths, protrusions, small faces): just capture that in your to do list for the moment."* A study by the four-part method (the rules; the obstacles and the fallbacks; a systematic design from prior art; an audit of what is built), approved by the owner before any build; C5 / W9's mouth as a concave edge is part of it | the owner's approval of the study |

## 7. C0 — THE OFFLINE ROUND (run 2026-11-16: `npx vite-node scripts/probes/free_face_study.ts`, a few seconds; `VERBOSE=1` for every table)

**Part A — the free faces of the 35 shapes** (the world's hold): 41 level faces; on every one the layout of each edge is square to that edge (into
a top face, out of a bottom one), so an exit's turn is the angle between two edges' own directions — pure polygon geometry:

| the face | the exits' turns |
|---|---|
| a rectangle (33 of the 41 — the cube's, every lying prism's bottom, the frustums', the plates') | 0°, 90°, 180° |
| a triangle (4) | 0°, 120° |
| a regular pentagon (the dodecahedron's 2) · an irregular one (2) | 0°, 72°, 144° · 70 – 75°, 143 – 146° |
| an octagon (the crossed heptagons' bottom) | 0°, 45°, 90°, 135°, 180° |
| ⚠ a wedge's thin triangle (2) | 0°, **100°**, 160° — the exit W6 names: over 90° and under the 120° the hold is set from today |

**Part B — `Scene_0bis` as a spit, far out** (a model: the real `spitSide`, `spitCameraHeading`, `fingerInFrame`, `fingerSwapped`; the calm by its
rule's shape; no ease, no spring), its level bottom face by today's rules and by the carried heading:

| the path | | the picture turned with NO edge under the gizmo | samples where the gizmo goes against the finger | the world's vertical DOWN the glass (worst) | the turn |
|---|---|---|---|---|---|
| from the triangle under a tip to the body's middle, 2° off the middle (either half) | today | **89°** | **10 of 161** — all on the level face | — | none asked: the app then adds the veer of §4.1 |
| | N1 / N2 | 1° | 0 | — | none — the heading carried in |
| across the bottom face round the axis | today | **180°** (the side changes in the middle of the face) | 0 | 0.03 | the half turn in the MIDDLE |
| | N1 | 0° | 0 | 0.00 | ONE turn of 180° at the far edge, then the hold |
| | N2 | 0° | 0 | **0.44** (just before the far edge) | the same |

So D-T2's rule removes both turns that have no edge, and the finger's mapping is right at every sample; N2's cost is as estimated (the world's
vertical pointing down by 0.44 of its length in the last part of the face), N1's is the orbit over that face becoming a pan. ⭐ To judge on the
device: both behind one slider at C4.

## 8. THE WAY OUT OF CLOSE IN (D-T1) — to measure, then step C3

The owner (2026-11-16): *"no, I would prefer to return to the orbit when the distance is crossed back (0.65m currently), so the tilted pole orbit is reserved for close in. I don't like to see the top of the scene square at far distance. The close in square is for fine placement of the piece, not for scene view. Find a way to blend properly the camera movement on the way out."*

**What the way out has to turn.** On a top face the polar orbit's camera stands on the side of the gizmo's own place, its up on the glass pointing
over the pole from there; the close-in layout's up is the heading carried in. Between the two: nothing when the gizmo is on the half of the face
nearest the edge it came over, a quarter at the sides, **half a turn on the far half** — and the camera travels round to that side. The polar
layout's pole is in the middle of the face, so this cannot be removed. It can only be PACED.

**Today, measured** (2026-11-16, `Scene_1`, close in on the top, ONE approach drag out; the session's `tilt_check.mjs`, `MODE=out`):

| the gizmo | the finger | the view's turn after the threshold | meanwhile the piece backs out |
|---|---|---|---|
| on the FAR half of the top | slow (1 px a frame) | **180° in 0.52 s**, a constant 6° a frame from its first frame to its last, the gizmo held | 1.4 m |
| on the far half | faster (4 px a frame) | the same 180° in 0.52 s | 5.3 m — the zoom is over long before the turn: the turn TRAILS it |
| on the near half | slow | 20° in 0.38 s, 3.6° a frame | 1.0 m |

So the turn is a fixed half second whatever the finger does, it starts and stops abruptly, it holds the gizmo, and at any normal speed it runs on
after the zoom has finished. ⚠ The approach's DISTANCE cannot pace it: it grows by 1.4 m in half a second under the slowest finger — only the
finger's own travel can.

**The way out — as briefed (step C3; the owner's go: *"Continue next step"*, 2026-11-16)**, under `chartLayout` 1:

| | the way IN (as built) | the way OUT (C3) |
|---|---|---|
| at the threshold | the layout taken, the sections square at once | the polar orbit back, the sections polar at once; the gizmo kept — as today |
| the camera | waits while the approach goes on | **follows the approach finger's own travel**: its turn from the picture shown to the polar camera is whole after `tiltOutBlendMm` of it (a new slider, millimetres ON THE GLASS; 0: today's timed turn), with a smooth start and end |
| its speed | — | never faster than the tilts' one speed (`tiltRollDegS`, T5): a fast finger does not flip the picture in a frame — the turn then runs at that speed |
| if the finger orbits before it is whole | blends by the finger's first millimetres (`tiltBlendMm`) | the same |
| by time | never | only once the finger has LIFTED with the turn unfinished: it completes at the one speed — never left half done |
| the gizmo | free | **free** — ⛔ today held while the turn runs |
| turning back | — | the share never rewinds (no approach jitter into the camera, T11); back within the close-in distance the way in takes over, from the picture shown |

What is shown is ONE mix from the picture frozen at the threshold to the live polar camera, so the direction and the up arrive together (the square
camera's own ease runs under it).
⚠ **What to expect**: on the far half of a top face the picture still turns half round — that cannot be removed (D-T1). Under a slow, deliberate
finger it now follows the finger; at a normal speed it still takes about half a second (the one-speed rule), with a smooth start and end and the
gizmo free. The slider stretches it.

### 8.1 As built (2026-11-16: `86f2cbe`, an Opus agent; audited by Fable, one completion — the one speed on the PICTURE)

`tiltOutBlendMm` (12 mm; its slider after `tiltBlendMm`, TILTED POLE; 0: today's timed, held turn); pure, in `src/input/seam_turn.ts`: `seamOutPaced`
(the tilt left by distance — its latch off — under the charts' layout, the slider over 0), `seamOutTarget` (the larger of the two finger travels over
their spans; whole once no finger is down), `seamOutStep` (toward the target, never back, the SHARE SHOWN never faster than `tiltRollDegS` — ⛔ as
first built the step was taken on the progress under its smooth ends: 540°/s in the middle), `seamOutShare` (the smooth start and end),
`turnHoldsGizmo`. The turn's progress and its two travels live on the turn itself (`asmZoneMix.out`); the approach's outward millimetres are fed from
`approachInput`, the orbit's from the drag's step. **2058 vectors** (21 for this step). **The gates** (`Scene_1`, the gizmo on the far half of the
top, one approach drag out):

| the finger | before | C3 |
|---|---|---|
| slow (1 px a frame) | 180° in 0.52 s at a constant 6° a frame, abrupt at both ends, the gizmo held | the turn follows the finger: 180° over its 12 mm (0.77 s here), from 2.7° a frame up to **6.0°** in the middle and down to 1.4° — never over the one speed |
| faster (4 px a frame) | the same 0.52 s, trailing the zoom | at the one speed with smooth ends: 0.6 s, at most 6.0° a frame |

The replays: the slider at 0 — the three scenes bit for bit what they were; forced off — unchanged; the defaults — `Scene_1` and `Scene_0bis`
unchanged, `Scene_0` another 63 frames round one approach out, its largest turns the same. ⚠ Not measured in the app (vectored only): a finger held
still mid-turn (the camera waits), an orbit begun during the turn (the gizmo free, the turn finished over the orbit's first millimetres), coming back
in mid-turn. ⚠ As §8 says: at a normal finger speed the half turn still takes about 0.6 s — it is the one-speed rule's.

## 9. STEP C4 — A SPIT'S LEVEL FACES, as briefed (2026-11-16; D-T2; under `chartLayout` 1, in a spit zone only)

The record of what the build is asked to do (its as-built entry follows the audit):

* **The state — one field**, `asmFree`: the free face the gizmo is on (the map it indexes, the facet, its place in the atlas's contour) and the
  HEADING carried, a direction in the face's plane. None everywhere else, with the switch off, outside a spit, under a tilt.
* **The entry — in at the edge** (the form of the tilt's entry, step 2.4d): the frame the place's own facet is a level face. The heading is the
  entry edge's (`entryHeading`: the neighbour's up unfolded — from a tip's triangle: along the body's axis; from a long side: across it); with no
  edge to read (the first frame, a pick-up with the gizmo already there) the layout nearest the picture's own up (`nearestHeading`). One camera turn
  from the pose shown starts there (by the rule, next to nothing); no hold.
* **On the face**: the camera's up IS the heading (`freeHeadingAngle` → `offsetFrame`) — ⛔ the side's (`spitCameraHeading`); the finger is read off
  the picture at every pitch (`fingerInFrame`) — ⛔ the swap above 60° (`fingerSwapped`); the spit's side is frozen: no side change, no crossing, no
  hold in the middle of the face (`spitStep` returns).
* **The exit — out one band past the edge** (`gizmoEdgeMarginMm`, the tilt's exit's own distance): the turn `exitTurnRad(heading, …)`; ONE camera
  turn from the pose shown to the upright camera of the face beyond, the gizmo held; the spit's side read afresh there; the dy hold when the turn is
  over 90° (D-T4) — on this rectangle the half turn alone.
* **Far out, the two variants behind one slider**, `freeFaceSquare`: 0 (N2, the default) the calm kept; 1 (N1) the camera square to the level face at
  every distance (the square camera's share whole there). The owner judges on the device.
* **Not touched**: gravity's tilt, the upright zones, the ridge's crossing, the calm's rules, `Scene_1` and `Scene_0` (no zone: their replays with
  the switch ON stay bit for bit). `spitSide`, `spitCameraHeading`, `fingerSwapped` stay for the bound faces and the switch-off path.
* **The gates**: `mid_check.mjs` (the arrival from a tip: no veer, no turn, no hold, the drag reaches the body's middle); `across_check.mjs` (one drag
  across the face: nothing at its middle, ONE half turn one band past the far edge, then the hold); the replays (off: unchanged; on: `Scene_1` and
  `Scene_0` unchanged, `Scene_0bis` another play, its view's turns no worse).

### 9.1 As built (2026-11-16: `0125445`, an Opus agent; audited by Fable, one completion `28df70c` — §10's hold)

`asmFree` (the free face's map, facet, contour place and the heading carried), `freeFaceFrame` / `freeFaceExit` in the wiring; pure, in
`src/input/free_face.ts`: `contourFaceAt` (a map's facet found on the contour by its normal and plane), `freeEntryHeading`, `freeHeadingAngle` (the
heading for which `offsetFrame`'s up IS the carried heading — solved: the simple "plus below, minus above" is exact only straight up or down),
`exitHoldSign` (§10). The camera's spit branch, `zoneFinger` and `spitStep` each read `asmFree` first. **2038 vectors** (25 for this step; red on
27 mutants). **The gates** (`Scene_0bis`, both switches on, far out):

| the run (one drag, a straight finger) | before (the live build) | C4 |
|---|---|---|
| from the triangle under a tip, 2 mm off the middle, toward the body's middle | the gizmo veers to +79 mm across the middle; the side changes; 334° of view, 18.7° in a frame; the dy hold blocks the last 308 frames; the middle NOT reached | the gizmo stays 2 – 5 mm off the middle; no side change; one entry turn (2 frames, at the rim edge); 76° of view, 6.2° in a frame; no hold; **the middle reached**; the body's axis stays up the glass |
| across the bottom face from the rectangle beside it | the half turn in the MIDDLE of the face | nothing at the middle; **the half turn one band past the far edge**, then the dy hold (the finger must reverse); 6.6° in a frame |
| the same two with `freeFaceSquare` 1 (N1) | — | the same events; 5.0° and 9.2° in a frame |

The replays: switches off — the three scenes identical bit for bit; on — `Scene_1` and `Scene_0` identical bit for bit (no zone), `Scene_0bis` another
play from drag 5: the view's largest turn in a frame 11.9° → 14.1°, its roll's 21.0° → 18.9°, frames with a roll over 10° 46 → 27, none over 20°.
⚠ Known, by design: with `freeFaceSquare` 0 the world's vertical points down the glass in the last part of the face before a far edge (§7: up to
0.44 of its length); an entry costs about one frame of finger (the gizmo held while its near-zero turn runs); the long-side entry seen off the
plane square to the axis leaves the axis up to ~3° off the glass's horizontal. ⚠ Not measured: N1's gizmo hold at the face's edges
(`squareTurning`); the ridge at the top arrived at from a tip (still the old rules).

## 10. D-T4 — WHEN A TURN SETS THE DY HOLD (weighed by the builder at the owner's word, 2026-11-16)

**What the hold is for.** After an exit's turn the face beyond is upright on the glass, and for a face hanging under a top face "up" on the glass
points straight back at the edge just crossed (under a bottom face: "down"). So the ONE finger direction that undoes the crossing is known from the
geometry. It matters only if the finger is still pushing that way — which is the case exactly when that dy is what carried the gizmo over the edge.

| | from 90° (the first proposal) | from 120° (as built) | **from 90°, and only the dy that pushed over the edge (built)** |
|---|---|---|---|
| a rectangle's far edge, crossed by its dy | held | held | held — the same |
| a rectangle's side edge (a quarter turn, crossed by dx) | not held | not held | not held — the same |
| an edge slanted 10 – 30° off the finger's way (a triangle's, a heptagon's: turns of 100 – 120°), crossed by pushing dy at it | held | ⛔ not held: the same dy brings the gizmo back over the edge at once, the layout re-anchors on that edge — a bounce and a turn | held |
| the same edge crossed sideways by a dx, the finger's last dy an old or opposite one | ⛔ held on a dy that crossed nothing — a direction blocked for no reason (the owner's *"there are times I cannot reverse"*, 2026-11-14) | not held | **not held** |

**The rule** (pure, `src/input/free_face.ts`): at an exit over an edge whose outward direction in the face is `e`, with the heading carried `h` —
the turn is over 90° exactly when one dy sign moves the gizmo out through that edge (up on a top face, down on a bottom one); the hold is set on
the finger's dy sign only if it IS that sign. On every face that carries a layout today (rectangles) nothing changes; the difference appears only
on faces D-T5 keeps polar for now. Gravity's tilt keeps its own test (`edgeHoldAt`, 120°) until the half turns become one event (step C5).

## 11. THE TWO SWITCHES ON BY DEFAULT (the owner, 2026-11-16)

After his look on C4 (main `6685f8f`): *"This is good. Commit. For the next deploys always toggle on the two switches by default in all the scenes. Continue next step"*

* **What changes**: `chartLayout` and `chartCalm` are 1 in the defaults — every scene, every device, from the next deploy on. The sliders stay
  (GIZMO & SECTIONS); `?chartLayout=0&chartCalm=0` is the game as it was before the charts (the old detectors live until step 2.5 deletes them).
* **The gates**: with both forced to 0 the three scenes replay bit for bit as the switch-off baseline; with no parameter they replay as the
  switch-on one.
* ⚠ **`Scene_2`** has never been run with the switches on (the owner keeps it out of these passes: *"I will do it myself when I troubleshoot the
  scene"*): with this default it runs the charts' layout too.

## 12. STEP C1 — W11, THE TILT'S ENTRY UNDER A FAST DY (2026-11-16, an Opus agent)

**As briefed**: the fault as measured — `Scene_1`, close in, the automatic tilt made on the cube's top under a FAST dy: the view turns 8.5° in ONE
frame at the tilt's entry (W11, never analysed). Reproduce it (`tilt_check.mjs`, a fast dy; per frame the view's turn, the turn's share, the frame in
force, what changed state), on `Scene_0` and `Scene_0bis` too; find WHICH quantity jumps in that frame and WHY (to test, not to conclude: the way in's
share paced by the finger with no cap on the picture's speed; the square camera's target; the piece's direction ease; the frame set at once while the
turn starts a frame late). Write the root cause here. Build the fix only if it is clear and systematic — the expected form: *from the pose shown, the
share SHOWN never faster than the tilts' one speed* — under `chartLayout` 1 unless the fault is in common code; if it is not clear, or it changes what
the owner has looked at and accepted elsewhere, report the options. The gates: verify, the off replays bit for bit, the default replays explained,
`tilt_check` on the three scenes (the entry's largest one-frame turn at or under the one speed's step, nothing else moved), `edge_noise`, `mid_check`,
`across_check` unchanged.

### 12.1 Measured — what turns in those frames, and why

`tilt_check.mjs` (its default run, 5 px a frame of dy) with every frame's state recorded besides (the camera's TARGET pose before the turn's mix, the
turn's share and angles, the direction's ease, the square camera, the calm, the piece's place — a copy of the probe in the session's scratchpad, the
wiring read through temporary lines, reverted). `Scene_1`, the tilt made on the top at the frame marked ▶ (the approach over: the turn goes by TIME):

| frame | the view (° in the frame) | the camera's target pose (°) | the turn's share k | the camera's turn (°) | the direction's ease (°) | the square camera's normal (° in the frame) | the piece (mm in the frame) |
|---|---|---|---|---|---|---|---|
| 84 | 3.1 | 3.1 | — | — | — | 0 | 17 |
| ▶ 85 | **6.2** | 0.04 | 0 | 0.04 | 6.49 | 6 (its target now the top, 84° away; its share 0.40 → 0.60) | 61 |
| 86 | **8.0** | 1.75 | 0.92 | 1.8 | 6.49 | 6 | 87 |
| 87 – 99 | 2.6 → 6.0 | the same | — (over) | — | — | 6 a frame | 38 – 66 |

**The quantity that jumps is the piece's SHOWN direction** — not the camera's target (it moves 0.04° in the tilt's frame) and not the frame's angles
(`seamRebase` keeps the gizmo, and the piece's raw direction moves 0.04° there too). Two causes, one inside the other:

1. **The ease read too early.** The tilt's one transition (`tiltOn`) reads the gap between the direction drawn before and the new chart's
   (`seamEase`, 6.49°) the moment the frame changes — before the same frame's calm and square camera have run (`calmFrame`). But the tilt has just
   changed the square camera's target (the top's normal), and in that same frame the square camera takes its first step (its normal 6°, its share
   0.40 → 0.60): the raw direction comes back by ~6.5°. The ease is then applied to a direction that no longer needs it: at k = 0 the piece is drawn
   6.45° off the place it had — against the ease's own rule (*at the start exactly the one drawn before*, `seam_turn.ts`) — and the framing of the
   turn (`poseFramingTwo`, which keeps the piece where it was on the glass) turns the camera 6.2° to hold it. The next frame the turn's clock reads a
   whole of 0.04° + 6.49° and advances 0.92 of it at the one speed — 5.97° released, plus the square camera's own step: 8.0°.
2. **Two clocks in one transition (the root).** Every change of frame close in — the tilt's entry, its exit, the ridge's crossing (`poleCross`), the
   spit's crossing — also changes the square camera's target, and the square camera then turns on ITS OWN clock at the one speed (`squareTurn`: 84°
   on a box's edge), while the transition's ONE turn (`asmZoneMix`) runs at the one speed over its own angle from the pose shown to a target that is
   itself turning. On the glass the two add. Measured on the default run of each scene (the view in one frame while both run):

| scene | the transition | the view, a frame (°) | for how long |
|---|---|---|---|
| `Scene_1` | the tilt's entry on the top (above) | 6.2, **8.0** | 2 frames |
| `Scene_1` | the tilt's entry on the bottom (swing 38°) | 5.3, 6.7, then 6.0 | 2 frames |
| `Scene_1` | the tilt's exit by dx (a quarter turn) | **8.7 → 8.0** | ~10 frames (the run's largest, 8.7 — not the entry) |
| `Scene_0` | the tilt's entry on the bottom | 6.4, **8.2**, 6.9 | 3 frames |
| `Scene_0` | the ridge's half turn (2.4b) | **8.8 → 8.5** | most of its ~30 frames |
| `Scene_0bis` | the spit's half turn | 6.9, **8.9 → 8.1** | most of its ~30 frames |

**In plain words**: when the frame changes, the game starts ONE camera turn from the picture on the glass — but the camera's "square to the face"
rule starts its own pitch over the edge at the same moment, at the same speed. Each obeys the one speed; together the picture moves up to one and a
half times as fast. At the tilt's entry it shows as a jolt, because the piece's direction is also corrected for a step that the pitch had already
undone in that frame.

The brief's candidates: the finger's pace — not involved (made with the approach over, the turn goes by time); C3's cap — the turn's own clock
already keeps the one speed, the excess is its moving target; the direction's ease — yes (1.); the turn starting a frame late — costs nothing by
itself (the camera's turn is 0.04° at its first frame).

### 12.2 Tried, measured, reverted — nothing of it committed

| trial | `Scene_1` | `Scene_0` | `Scene_0bis` |
|---|---|---|---|
| today | the largest 8.7°, in all 673°; the entry 6.2 / 8.0 | 8.8° | 8.9° |
| T1 — the ease read once the frame's view is set (after `calmFrame`) | the entry **0.4 / 1.4**; but the bottom's entry **10.4** (was 6.7): the gap now holds the square's first step, which the camera's turn counts too, while the square keeps turning | — | — |
| T2 — T1, and the square camera at its target while a transition's turn runs (its pitch INSIDE the one turn) | **6.0** at most, in all 504°; the same tilts made / left | 8.0 (a finger drag, no turn running) | ⛔ **54.6**: the spit's turn starts in the camera's stage, after the read — the piece's direction jumps; every start of a turn would need the read |

So (1.) cannot be fixed alone: it is part of (2.). T2 shows the shape of a fix, and that it is not local.

### 12.3 Why it is not built

The cause is structural (a transition's one turn and the square camera's pitch: two clocks, the ease read between them), it lies in code every change
of frame close in shares (the tilt's entry and exit, the ridge, the spit, the zones), and any fix changes how every one of them looks — the ridge's
and the spit's half turns from 8.5 – 8.9° a frame to 6°, their pitch over the edge merged into the one turn — which the owner has looked at and
accepted (2.4b, 2.4c, C4). By the brief and the standing rule (*root cause before patch*): the finding, the numbers and the options; no build. A fix
for the entry alone would be the special case beside the rule.

### 12.4 The options — the owner's

| | what | what the player sees | cost |
|---|---|---|---|
| **A** (recommended) | **The one turn truly one**: while a transition's turn runs the square camera's target is reached INSIDE it (its pitch part of the one turn), and the direction's ease is read once the frame's view is set — at every start of a turn (the tilt's entry and exit, the ridge, the zone's switch, the spit's crossing in the camera's stage, a free face's entry and exit) | every change of frame close in turns the picture ONCE, never over the one speed (today 6.9 – 8.9° a frame); about as long as today (the larger of the two angles at the one speed) | a build across the turn starts; the three scenes' replays change at every transition (T2: `Scene_1` 8.7 → 6.0°) |
| **B** | **A limiter on the picture**: each frame the turn's share held back until the picture moves no more than the one speed from the pose shown, whatever runs beside it | the same cap; the two motions still overlap | the piece's ease would lag the camera's share by a frame; a target turning faster than the speed by itself is not limited |
| **C** | **One shared budget**: the square camera's pitch takes each frame only what the transition's turn leaves of the one speed | the pitch slowed while a turn runs | two clocks kept, coupled — W1's shape (one obstacle, several mechanisms) |
| **D** | **Keep as is** | 8 – 9° a frame at a transition under a fast finger: a jolt of 1 – 2 frames at the tilt's entry, the whole half turn at the ridge and the spit | nothing |

## 13. STEP C5 — ONE HALF-TURN EVENT (2026-11-16, an Opus agent; W1, W6; D-T4)

**As briefed**: today FOUR places each make *"a crossing that turns the camera and may hold a dy"* — (1) gravity's tilt left over its far edge
(`tiltOff` + `edgeHoldAt`: the hold from 120°, the finger's last dy sign); (2) the ridge crossed in a pole zone (`poleCross`); (3) the spit's change of
side (`spitStep` + `crossingHold`); (4) a free face's exit (`freeFaceExit` + `exitHoldSign`: held when the turn is over 90° AND the finger's dy is the
one that pushed the gizmo out over that side — D-T4; the owner: *"i have no particular opinion. Weigh the pros and the cons and build what is best"*).
Make them ONE event: a pure function in `src/input` (the turn between the up shown and the next face's own up unfolded across the edge crossed; the
hold's sign by the D-T4 rule) and ONE wiring function the four sites call (the frame set at once, the gizmo kept, every angle state set, one camera
turn from the pose shown, the hold); each site keeps only what is truly its own; the dead fields removed; under `chartLayout` 1 — with it 0 the four
sites bit for bit as today. Then measure the spit's top ridge ARRIVED AT FROM A TIP (`Scene_0bis`): the old rules still act there (the finger's axes
swapped above 60° of pitch, `spitCameraHeading`'s side bias) — a fault measured gets its root cause; a fix only if systematic and inside this event;
a change of the rule for the finger's axes is the owner's. ⛔ Not in it: a mouth as a concave edge (W9, moved to the study before step B), the free
face's layout rule, C3's way out, the calm.

### 13.1 The four, as they stand (read on `1190db2`)

| | (1) the tilt's exit | (2) the ridge crossed close in | (3) the spit's change of side | (4) a free face's exit |
|---|---|---|---|---|
| the trigger | the place one band past the tilted facet (`tiltFrame` → `exit`, made at the next frame's start) — or the latch off by distance (`off`) | close in, the map's angles at ±90°, the finger asking beyond (`poleCrossingDue`) | the camera's shown direction crossing the vertical plane through the axis, steeply (`crossingPitch` ≥ 60°) — in the CAMERA's stage, read off the camera's place | the place one band past the free face (`freeFaceFrame`) |
| the frame | gravity's (the tilt dropped) | gravity's, unchanged | the zone's, unchanged | the zone's, unchanged |
| the angles | `seamRebase` at the gizmo (the world map's; at its pole the heading shown kept) | `seamRebase` at the far face's (`poleSeam`) | — | — |
| the camera's turn | `seamTurnStart` from the pose shown (by distance: C3's `seamOutStart`), the ease from the direction drawn (`seamEase`) | the same turn written out, `seamEase` | the same turn written out, the ease running carried (`easeCarry`) | the same, `easeCarry` |
| the hold — who | `edgeHoldAt(tl.heading, nT, nW, g, dySign)` (never by distance) | `edgeHoldAt(orbit.yaw, n0, nFar, P, dySign)` | `crossingHold(g, gizmoNormal, axis, side, dySign)` | `exitHoldSign` → `crossingHold(…, held)` |
| its threshold | the face beyond's level normal more than 120° from the heading | the same | none: every crossing | the turn over 90° |
| its sign | the finger's LAST dy sign, whatever crossed | the same | the same | the dy that pushed the gizmo out over that side (D-T4) |
| its side | — (the field `d`, into the face beyond: never read) | the same | the same | the same |
| **dead** | `EdgeHold.g0`, `EdgeHold.d` — written by `edgeHoldAt` and `crossingHold`, read by nothing (the hold reads `sign`, `back`; the play recorder too) | ← | ← | ← |

The hold ends the same way for all four: the finger the other way for `edgeHoldMm` (`edgeHoldFinger`), the gesture's end (`gestureOver`), the
assembly's orbit off; (3) also when the side changes round a tip. The gizmo is held while any of these turns runs (`tiltClampStep`), but C3's paced way out.

### 13.2 The design

* **The rule, stated once** (D-T4 made exact — §10): after a crossing, hold the dy sign `s` when **`s` pushed the gizmo out over the edge** — on the
  glass `s` moves it along the up SHOWN `T`, so `s·T·out > 0` (`out`: from the face left toward the edge, in its plane) — **and `s` would bring it
  straight back after the turn** — `s` then moves it along the next face's up `U`, so `s·U·out < 0`. On a free face's level edge `U` is `−out` (into a
  top face) or `+out` (out of a bottom one), and the pair is EXACTLY §10's (the turn over 90° and the dy that pushed): the free face's exits keep their
  behaviour. Elsewhere it decides what 120° and the last dy sign guessed: a dy sliding ALONG an edge it drifted over is not held when the turn does
  not send it back.
* **Pure** (`src/input/free_face.ts`): `faceOwnUp` (a face's "up" — the holding up laid in its plane; none on a level face), `unfoldAcross` (a
  direction of the face beyond turned about the edge onto the face left's plane — `freeEdges`' own unfolding), `edgeOut`, `crossingHoldSign` (the
  rule), `crossingEvent` (the turn between `T` and the next face's up unfolded, and the hold) — `exitHoldSign` now through `crossingHoldSign`.
* **What each site hands it** (its own, by the rule that shows the picture): (1) `T` the tilt's own up (`map · y`: upright in the tilted frame), the
  faces' world normals; (2) `T` the face left's own up (a bound face is upright); (4) the heading carried and the side's layout (as built);
  (3) the spit's side flips the camera to the mirror view (the same height, the other side of the axis): `T` the up drawn last frame (the side's
  upright camera, `asmCamLast`), `U` its mirror across the side's plane, `out` toward the new side — ⛔ built, measured, withdrawn (§13.3).
* **ONE wiring function** (`crossTurn`): the rebase when the site hands angles (the angle states, the place shown with its eased relocation, the
  band read afresh — (1), (2)); ONE camera turn from the pose shown (paced by the finger on C3's way out), the piece's direction eased from the one
  drawn (a change of frame) or the running ease carried (none); the coast stopped; the hold. Each site keeps its trigger, its frame and its views
  (the calm, the square camera's target, the held zenith heading, the spit's side, the free face's state).
* **Expected**: `Scene_1`'s cube as today (the far edge crossed by its dy: held; a side edge: not); on the heptagon's scenes a difference only where
  the last dy sign was not the one that pushed — each measured below.

### 13.3 As built (2026-11-16, an Opus agent)

* **Pure** (`src/input/free_face.ts`): `crossingHoldSign` (the rule of §13.2, its floor `CROSSING_PUSH_MIN` 1e-9), `faceOwnUp`, `unfoldAcross`,
  `edgeOut`, `crossingEvent` (the turn and the hold); `exitHoldSign` now through `crossingHoldSign` (the same answers on a free face's level sides).
* **ONE wiring function** (`crossTurn`, `assembly_wiring.ts`), called by the four sites under `chartLayout` 1: `tiltOff` (twice: with a place to keep
  and without), `poleCross`, `spitStep`, `freeFaceExit`. What each keeps: `tiltOff` its frame, the calm and the square camera out of F, the paced way
  out's flag (C3); `poleCross` the far face's views (the held heading, the calm, the square camera's target); `spitStep` its side and its trigger;
  `freeFaceExit` the free face's state and the side read afresh (its unused zone argument removed).
* **The hold**: the tilt's exit and the ridge by `crossingEvent` (`T` = `map · y`; the face left's own up); a free face's exit by `exitHoldSign` (as
  built, through the rule); with the switch off `edgeHoldAt` and `crossingHold` as before.
* ⛔ **The spit's change of side keeps §8's hold** (the finger's last dy sign, `crossingHold`), through the one event. The mirror view as its next up
  was built and measured, then WITHDRAWN: arrived along the top ridge from a tip (`ridge_check.mjs`, close in) the picture turns ~110°, not a mirror;
  the dy that had crossed was judged not to push (the gizmo crossed by the tip triangle's fall line, not by the finger's way on the glass), was not
  held, and brought the gizmo straight back over the ridge — a second half turn: the view 124° → 343° in the drag, from both tips. The rule needs the
  up the picture turns TO, which a side read off the camera's place does not give (§13.4).
* **The dead fields**: `EdgeHold.g0` and `.d` deleted; `edgeHoldAt` and `crossingHold` lose their `g0` argument (their `null` cases kept — the switch
  off bit for bit).
* **Vectors**: `tests/crossing_event.test.ts` (13; **2071 vectors**, 163 files); the source pins of seven files moved to the event; red on 11 mutants (the come-back test dropped,
  the push test dropped, the push floor at 0, the unfolding reversed, the outward direction reversed, the own up not laid in the plane, the hold not
  set by the event, the tilt's exit back on `edgeHoldAt`, the rebase skipped, the spit's hold dropped, `exitHoldSign` on the last sign).

**The gates** (against `scripts/probes/ORBIT_GATES.md` §6, the baseline at `276a6c2`):

| gate | result |
|---|---|
| the replays, `chartLayout=0&chartCalm=0` | `Scene_0` identical; `Scene_1`, `Scene_0bis` 2.0e-11 / 2.9e-9 from frame 3 (`1e-6: never`) — the baseline's own noise |
| the replays, the default | the three scenes IDENTICAL in every frame (2794 / 2794): the seeded play never crosses an exit turning 90° – 120°, nor a far edge or a ridge with another dy sign |
| `tilt_check` default, `chartLayout` 0, `out` (1 and 4 px), `ridge`, `press`, `rim`, `pole` | every number equal to the baseline (default 8.7 / 673, 8.8 / 2149, 8.9 / 3627 with 13 holds; the way out 180° at 6.0° a frame; the ridge's holds 54 / 54, 45 / 45, 51 / 51, 36 / 36) |
| `mid_check`, `across_check` (default and off) | equal: the middle reached, 76° / 6.2°; across 241° / 6.6°, the half turn past the far edge, 936 frames held |
| `edge_noise` (top ±2.5 mm, three scenes; side ±10 mm) | equal: the tilt made / left 0, the view 0° |
| `ridge_check` (new), 8 runs | equal to the code before in every run (once the spit's hold was kept) |

**Where the rule changes what the player feels** (vectored; no gate run reaches it): a tilt's exit or the ridge crossed with the finger's last dy
the OTHER way (an edge crossed by a dx with an old dy sign): no hold — before, that old sign was held; an exit turning between 90° and 120° (a free
face that is not a rectangle — none takes a layout yet, D-T5): held for the dy that pushed — before, free.

### 13.4 The top ridge arrived at from a tip (`Scene_0bis`) — measured, nothing built

`ridge_check.mjs` (new, `scripts/probes/`, its runbook `ORBIT_GATES.md` §4): from each tip along the axis, close in and far out, then one drag back;
across the ridge from each side, then back:

| run | what happens |
|---|---|
| from a tip along the axis, close in (both tips) | the gizmo climbs the tip's triangle and drifts over the apex's ridge line (a straight finger follows the triangle's fall line, not the ridge's line: 3.4 → −10 mm off it); 16 mm past the rim the side changes: ONE half turn (the axis from ~110° on the glass to across it, the view 27° → 66° looking down), the hold on the dy that crossed — the drag then blocked 313 frames; after it the finger's dy goes ROUND the axis |
| the same, far out | the turn 30 mm past the ridge line (the −x tip); from the +x tip the drift took the gizmo round the body and down a long side (the view never steep) |
| across the ridge, close in | the half turn 21 – 31 mm past the ridge, then the hold until the drag ends — as designed |
| across the ridge, far out | the half turn **55 – 60 mm past the ridge** (of a face ~150 mm wide) |
| the finger's axes | never against the finger outside a turn (0 of 10 – 51 moving frames a drag; one frame 97° at a crossing); the swap above 60° acts only once the turn has put the axis across the glass — no swap under the finger measured |

**Root cause**: the spit's turn is triggered by the CAMERA's shown direction crossing the vertical plane through the axis (`spitSide`,
`crossingPitch`), not by the gizmo crossing an edge. Close in the square camera follows the gizmo, so the turn lands within 10 – 30 mm of the ridge;
far out the calm keeps the camera near the face's middle and the turn lands ~60 mm into the face beyond (against T4). Arriving from a tip the turn
itself is real — the ridge's faces are bound and upright puts the axis across the glass (O8: a roof entered from its gable end) — and its hold is
right (the same dy brings the gizmo back: the withdrawn rule proved it); what the player loses is the walk along the top. No hold "for no reason",
no swap under the finger.

**Options — the owner's** (each changes what the player sees):

* **R1** — the spit's half turn on a bound face at the GIZMO's edge, one band past it (the tilt's and C4's trigger), the camera's side set by that
  event, the hold by §13.2's rule with the face beyond's own up (known at an edge). Removes the far-out lag; the spit then the fourth site in full.
  A rebuild of the spit's camera heading on bound faces (W3's second half).
* **R2** — keep (the turn within the calm's lag far out).

## 14. PACKAGE T1 — THE TEST SCENES, as briefed (2026-11-16, an Opus agent; before C2's wiring)

* **What**: six test shapes as scenes, in a THROWAWAY worktree (`../orbit_charts_test_scenes`, branch `1.0.146t-Orbit-charts-test-scenes`, from
  `ef14420`) — nothing of it enters the game; only the findings come back here (§15). Each: one placed body (or a few glued ones), the green piece, a
  goal, added as data the way `Scene_0bis` was (`src/content`, `BodySpec`): (a) an upright prism whose level top is NOT a rectangle; (b) a shape on
  which the charts choose RINGS (the simplest of [`ORBIT_CHARTS.md`](ORBIT_CHARTS.md) §6's); (c) a step — a low box against a high one; (d) an
  L-shaped level top (two boxes of one height); (e) a box turned 30° about the vertical; (f) a lying bar with pointed ends, thinner and longer than
  `Scene_0bis`'s.
* **What is run on each, headless, one run at a time**: the atlas (its zones, kinds, poles, caps, free and bound faces); far out a walk round (dx)
  and over the top and the bottom (dy); close in on each level face the tilt's entry, the layout shown against the entry edge, the exit over each side
  (the turn, the hold), the way out by distance; the square camera's target on the caps that are not rectangles; per frame the view's turn.
* **What is flagged**: a one-frame turn over the one speed's step (6.0°); a hold blocking a direction; a layout not carried from the entry edge
  (**W5**); a tilted frame whose map sits in the wrong box — the gizmo off the face, a wrong facet under it (**W7**); the square camera's target on a
  non-rectangular cap (**W8**); what RINGS needs that is not wired (**W12**). Nothing is fixed in this package.
* **As built** (2026-11-16): the six scenes and the probe on the throwaway branch (`367fa8a`, `a828c92`); T_b is a square bipyramid with a 1 mm
  band laid on a triangle (`BodySpec` has no octahedron) — the charts put it on RINGS; the findings → §15. `GAME_STRUCTURE.md` §7 not touched (no
  game scene added).

## 15. THE TEST SCENES — FINDINGS (before C2's wiring; package T1, 2026-11-16, an Opus agent — measured, nothing fixed)

**Where**: the throwaway worktree `../orbit_charts_test_scenes` (branch `1.0.146t-Orbit-charts-test-scenes`, `a828c92`; never merged) — the scenes in
`src/content/test_scenes.ts` (`?sceneIndex=5` … `10`), the probe `scripts/probes/t1_walk.mjs` and its batch `t1_batch.sh`. **Reproduce** (Git Bash, in
that worktree, one run at a time, 3 – 6 min a scene): `bash scripts/probes/t1_batch.sh "<index>"` (`PHASE=atlas|far|close`; `SHOW=<leg>` prints the
frames round that leg's largest turn). Both switches at their defaults (1). The probe: THE ATLAS (the world map's contour, `assignCharts`, the gravity
free faces, the zones) and the REAL faces (the parts' faces on their MODEL poses, coplanar ones merged); FAR a dx walk round, a dy to the top's limit
and to the bottom's; CLOSE IN a climb by dy up, then down — on every LEVEL real face met: W5 (the entry edge's inward way on the glass against the
finger's way: 0 = the layout carries the view), the view over the entry, the square camera's target; then four exits (up, right, down, left on the
glass): the turn, the hold, the same way again 6 frames (a hold blocks it), the other way, and back on by navigation (that re-entry examined too);
W7 (the gizmo on no real face; the map's facet normal, turned into the world, not the true face's); the way out by distance.
**The control**: `Scene_1` (`t1_batch.sh "1"`): every entry W5 0.0 – 1.6°; the far edge 180° and held (the same way again 1.8 mm); a side exit 90° –
120°, not held; one-frame turns: far drags 11.6°, timed turns 8.5 – 9.0° (W11's known level, §12), the way out 5.0°. ⚠ The probe's own artefacts:
the seams between pieces read "no face" (`Scene_1`, the L); the first entry after the approach is not yet square (the camera waits, T10); in a ZONE
the square camera's target is the zone frame's (not turned back: "90° off" there means nothing).

| scene (index) | what it is | the atlas |
|---|---|---|
| T_a (5) | an upright pentagon prism, 480 × 460 mm, 400 high | gravity: 5 cells, 2 caps of 5 corners — NO layouts (D-C2: polar at every distance), free |
| T_b (6) | a square bipyramid with a 1 mm band, on a triangle — the nearest `BodySpec` makes to the octahedron on a face | gravity breaks 8: the 6 side triangles and BOTH caps on RINGS (no layouts); the band's 4 slivers: 2 in the map (`BENT`), 2 dropped |
| T_c (7) | a step: a low box 400 × 160 mm against a high one 240 × 480 mm, one depth (480) | ⛔ the map ONE box, x 0 … 240, y 0 … 160 mm — no real face of either box (F1) |
| T_d (8) | an L-shaped top: two boxes 300 high | ⛔ the map the L's bounding SQUARE (6 facets; the top a 500 × 500 cap with 4 layouts) (F1) |
| T_e (9) | `Scene_1`'s box turned 30° about the vertical | 4 cells, 2 caps; each cap's 4 layouts along the turned axes — as designed |
| T_f (10) | a heptagon bar 240 × 240, 960 long with 180 mm tips, lying | the frame about x serves all 21 (the 14 tip faces as fans, the whole rule): a SPIT zone, as `Scene_0bis`; the bottom FREE |

**The findings** — each with its class and the scene that reproduces it:

| # | finding | numbers | class |
|---|---|---|---|
| **F1** | **A step and an L are not on the face map at all.** The world map (and so the atlas, `chartContour`) is the polytope of each direction's MAIN plane: on T_c the top's main region is the LOW top (larger), the −x side's the wall above it — their intersection a box neither part is. On T_d the top is the bounding square; the notch's two walls are not facets. The gizmo, cast to the real depth (D3), lands on real faces the map does not have, or on none | T_c: the low box's top and −x face never under the gizmo, far nor close in; no face 11 frames round, 86 up the front, 73 down. T_d: no face 81 + 34 + 43 frames of the dx round; at the top's limit (the pole = the box's centre = the notch's corner) the face under the gizmo FLICKERS top ↔ the notch's wall every 1 – 6 frames for ~500 frames; close in, the far edge over the notch drops the gizmo onto the notch's wall: **the dy hold SET with no turn (0°)**, the map's facet the top while the gizmo is on the wall (26 frames, 90° off) | **new** — structural (the faces contour is convex: "Step 8, what the contour misses"); W7 in its widest sense |
| **F2** | **W5 confirmed on a box turned 30°**: 4 of 10 entries onto a cap took a layout off the entry edge — 36° (the first), 90° (three: after the up and the right exits, the bottom's first entry) — the view turning 120° over the entry instead of 90°. Every entry on `Scene_1`, T_d's square and T_f's free face: 0.0 – 6.8° | T_e: 35.9°, −89.9°, −89.9°, +90.1°; the six others 0.0° | **W5** |
| **F3** | **W8 confirmed**: close in on a cap with no layout (T_a's pentagon top, T_b's RINGS triangles) no tilt; the square camera's target is the face LEFT | T_a top: 35.6° off square, the target 90° off the cap's normal; T_b top: 28.7 – 68.6°, 70.5°; T_b bottom (on the floor): 111°, 109.5° | **W8** |
| **F4** | **A cap with no layout is a STALL close in** (polar at every distance, D-C2): a dy into its middle stops there | T_a up: not left, the same way again 0.0 mm (the other way 78 mm); T_b's top: three of four exits never leave it; the fourth turns the view 149° at the drag's pace (13.1°/frame, no timed turn) | W8 / D-T5 as decided — a stall where T1 wants a side face's walk |
| **F5** | **RINGS not wired (W12 measured)**: far out on T_b a dy from the boot elevation to the top's limit keeps the gizmo on ONE side triangle — the place stalls on a face gravity's map breaks | T_b: the cap after 7 frames, then 494 frames on it; the triangles' homes RINGS, served by gravity's columns map | **RINGS** |
| **F6** | **The way out from a cap with no tilt is not paced** (C3 paces the TILT's only): the square camera lets go at the latch's off frame and the view turns at the drag's pace | T_a bottom (`PHASE=close SHOW=approach-out`): 8.5 → 9.6°/frame, 78° in 13 frames; in the full run (after the far walk) **55.6° in ONE frame**; T_b 12.1°/frame | **new** (C3's rule, for the square camera alone) |
| **F7** | **Timed turns over W11's level** at a bottom cap's side exit | T_c's bottom, exit right (to the high box's +x face): **18.9°/frame in a timed turn**; T_f's bottom (the spit's free face), exit right 11.8°; `Scene_1` 8.5 – 9.0° | **new** (W11's family: two clocks, §12) |
| **F8** | **A hold with no turn** | T_c's bottom, exit down: the hold SET, the view 0° net, then the same way again 292 mm (not blocked); T_d's far edge over the notch (F1) | **new** (the hold read off the map's square, not the real edge) |
| **F9** | **The spit bar** (T_f): far out a dx goes round the bar's axis (the yaw 28° in 40 drags, as designed), its drags 8.8 – 9.0°/frame; a dy 13.3° in one frame out of a timed turn; close in the bottom (a free face, C4) entered 6 times at W5 0.0 – 3.4° | ⚠ 1 649 frames with the map's facet 90° off the real face — UNCONFIRMED: the probe may read `asmShown` in the zone's frame while `asmZone` is null | W7 (unconfirmed) |

**Not found**: W7 in its narrow sense (a tilted frame's map in the world box's turned corners) on T_e — 0 frames off a face, 0 with a wrong facet in
a tilt: the turned layouts work (F2 is the CHOICE of layout, not the map).

**What RINGS needs that is not wired** (F5, T_b): the place on the ring at the pitch's height and the azimuth's half-plane (`ring_chart.ts`, built,
not called); its cap's rays on the cap's own outline; the seams to gravity's chart (one transition); a close-in camera for its caps (F3, F4).

**Open — the owner's**: F1 is the largest: the faces contour cannot hold a non-convex level set (a step, an L) — with the surface's definition
"before step B" (`RND5.md`), not C2. F2 is C2's W5 as designed (`entryHeading`). F3, F4, F6 are D-T5's loophole measured: a cap that is not a
rectangle has neither a layout nor a target. ⚠ Outside the orbit: a 4-sided `BodySpec.prismSides` comes out a DIAMOND (`render/bodies.ts` turns a
vertex to the top), so "one edge flat at the bottom" holds for odd sides only.
