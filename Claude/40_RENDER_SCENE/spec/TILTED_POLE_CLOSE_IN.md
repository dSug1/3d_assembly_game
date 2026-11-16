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
| **T8** | **Once per face.** A layout taken on a face is kept until the gizmo leaves that face | *"my new rule allows to convert a polar red-green face to a perpendicular red-green face once, until the gizmo crossing edges requires the polar orbit to realign its poles"* (11-09) |
| **T9** | **The half turn's price.** After a half turn the dy that crossed is held until the finger reverses; the hold ends with the gesture | *"the dy upwards is blocked until a certain band is reached in the face beyond but dx and dy downwards are allowed"* (11-12) · *"there are times I cannot reverse"* (11-14) |
| **T10** | **The approach is not disturbed.** Made during the approach, the layout changes the sections at once and the camera waits, then blends by the finger's first millimetres | *"the red-green sections automatically switches to orthogonal … but the camera view waits through the approach"* (11-11) |
| **T11** | **No noise into the camera.** Every trigger of a camera turn has a band | *"hysteresis where needed … so that input noise does not transfer to camera movement"* (11-15) · the middle of `Scene_0bis`'s bottom face (11-16) |
| **T12** | **Any geometry, one way.** The same rules on every shape; where a rule cannot hold, a stated fallback — never a case-by-case patch | *"analyze the deep root cause, don't patch with fix which may conflict with other rules"* (11-15) |

The charts' rules stand above these and in their order ([`ORBIT_CHARTS.md`](ORBIT_CHARTS.md) §1): Landing, Continuity and Upright never yield; then Finger;
then Sections; a camera turn at a crossing and a short hold are the price of straight sections. T1 – T12 say WHERE that price is paid.

⚠ **Three places where the owner's own rules pull against each other** — to settle in §5, not to patch:

1. **T8 against the distance switch.** *"if the piece crosses the hysteresis threshold, the tilt automatically triggers on or off"* (11-10) drops the
   layout in the MIDDLE of a face when the piece backs out past 0.65 m — a camera turn with no edge (T4). As built it can turn the camera right round
   (the gizmo on the far half of a top face — `RND5.md`, decision 10).
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
| **O12** | **Close in against far out** — the square camera exists within 0.6 m only | a choice, not an obstacle | the layout must not depend on the distance (T8); only the camera's share of "square" does (§5 D-T1) |
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
| the turn is over 90° | — | **the dy hold** (the dy that crossed would bring the gizmo back): the finger must reverse. ⛔ Today the hold is set from 120° (§4 W6) |
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

### 4.2 Weaknesses — where the code does not address the obstacle, or patches it

| # | what | where | against |
|---|---|---|---|
| **W1** | **Three families for one obstacle**: the tilt (gravity's caps, close in), the spit's side / bias / swap / crossing (a zone held by the world), the polar limit with its three pitch blends (`poleWeight` 60 – 85°, `cameraHeading` 50 – 60°, the held zenith heading). Each has its own trigger, turn and hold; the half turn is written three times (`tiltOff` + `edgeHoldAt`, `poleCross`, `spitStep` + `crossingHold`) | `assembly_wiring.ts`, `polar_zone.ts`, `orbit_calm.ts` | T12 |
| **W2** | **The tilt refuses every zone** (`tiltOn`: `if (st.asmZone !== null) return`) and reads the WORLD map's cap: a zone's free faces have no layouts in the wiring (an upright zone's cap — *its layouts are computed; the wiring cannot use them*) | `tiltOn` | O10 |
| **W3** | **The spit's turn sits on a line across a free face**, with a 2° band, a 60° → 75° blend of the heading and a hard swap of the finger's axes at 60° whose sign is undefined when the axis lies up the glass | `spitSide`, `spitCameraHeading`, `zoneFinger`, `fingerSwapped` | T1, T4 — §4.1 |
| **W4** | **The layout is dropped by distance in the middle of a face** (`tl.off`, the owner's rule of 2026-11-10): a camera turn with no edge, up to a half turn | `assemblyFrame`, `tiltOff` | T4, T8 — §1 tension 1 |
| **W5** | **The layout is "the one nearest the heading shown"** (`capTiltHeading(…, yaw)`), not "the entry edge's". Equal on a box (each side face owns ±45° of yaw); nothing checks that they stay equal on another polygon, nor at a corner | `tiltOn` | O1, O5 |
| **W6** | **The hold is set from 120°** (`edgeHoldAt`: the exit face's level normal under −0.5 along the heading): an exit that turns the view between 90° and 120° (a heptagon's end face: 103°) leaves the dy free to bring the gizmo back over the edge it just crossed | `orbit_tilt.ts` | O2, T9 |
| **W7** | **A tilted frame's map is built in the WORLD box's turned corners** (`tiltBox`): for a layout off the world's axes the box is looser than the shape and the map's share test drops its faces (found at step 1.1: the map all virtual at 45°). Today's tilt cannot serve a layout that is not along x or z | `faceMapOf` | O6 |
| **W8** | **Close in on a cap that takes no tilt** (a level face that is not a rectangle, D-C2) the square camera has NO target (`squareFrame`: *"none over a cap … the automatic tilt comes next"* — it no longer always comes): the camera keeps looking square at the face it left | `squareFrame` | O6 — a loophole, no scene has it |
| **W9** | **The mouth** (a void open toward a pole): a hold that depends on the path, and a tilt made from a face the gizmo is not on (`asmMouth`, `mouthHold`) — the one place the gizmo is not a function of the place | `assemblyFrame`, `tiltOn` | O11 |
| **W10** | **Bands in five spaces** — metres of distance, millimetres on the model (5 and 10), millimetres of finger (30), degrees of camera (2), a micrometre tie — and two triggers with none until step 2.4d (measured 2026-11-16, close in on the cube, the place wobbling ±3 mm across the top edge for 4 s: the tilt made and left 21 times, the view turned 1 188°; across a vertical edge: the square camera's target 20 times, 600°) | throughout | T11 |
| **W11** | **A turn's first frame** — the tilt's entry under a fast dy turns the view 8.5° in one frame (5.7° before step 2.4c set the followers' states) | `seamRebase` | T5 — not yet analysed: the first thing to measure in the build |
| **W12** | **Fallbacks with holes** — a face no columns chart serves goes to RINGS, which is not wired (it stays on gravity's map: the leaps and stalls of a BROKEN face); a partial fan likewise (D-C5); a near-level roof entered from its gable is BENT at the entry (by T6 — to be shown to the owner on a test scene, not found by accident) | `orbit_charts.ts`, the wiring | T12 |

### 4.3 The scripts — what no run covers

* **The offline prototype never ran close in** ([`ORBIT_CHARTS.md`](ORBIT_CHARTS.md) §6: *not covered — the camera's path, the calm in motion, the square
  camera*). No claim of §3 about a turn's angle on a shape other than the cube has been computed.
* **The replay** (the gate of every step) never arrives on `Scene_0bis`'s bottom face from a tip, never crosses `Scene_0`'s ridge close in, never rests
  on an edge. §4.1 and W10 were found by three probes written this session (`mid_check.mjs`, `edge_noise.mjs`, `tilt_check.mjs` — the session's scratchpad).
* **The walks** count jumps and rolls but have no rule for "a camera turn with no edge under the gizmo" (T4) nor "a finger moving, the gizmo not"
  outside the stated holds.
* **The vectors** pin the wiring by source strings in several places: they hold the code's shape, not its behaviour.

## 5. THE OWNER'S DECISIONS

| # | the question | recommended | its cost |
|---|---|---|---|
| **D-T1** | Is a free face's layout kept until an EDGE — also when the piece backs out past the close-in distance (your rule of 2026-11-10 turns it off there)? | **Yes**: only the camera's "square" share follows the distance | far out a top face can then be in its square layout until the gizmo leaves it — as it was after a press |
| **D-T2** ✅ | Do a spit's level faces follow the same rule — no turn in the middle of `Scene_0bis`'s bottom face, the half turn at its far edge, the picture unchanged when coming in from a tip? | **Yes** — ✅ the owner, 2026-11-16: *"D-T2: agreed"* | the spit's side, bias and swap are replaced, not tuned; N1 or N2 far out (§3.4) is yours to judge on the device |
| **D-T3** | Far out on gravity's top and bottom faces: polar and a limit (D-C6, today), or the same rule far out too (a top face crossable by dy again)? | **keep D-C6** now; reopen after D-T2 is seen | far out stays as you accepted it (*"polar orbit far out: the sections are ok"*) |
| **D-T4** | The dy hold from any turn over 90° (not 120°)? | **Yes** | none on a rectangle (its exits are 0, 90, 180°) |
| **D-T5** | A level face that is not a rectangle: the layout square to its entry edge (a tilt), or polar at every distance (D-C2, today)? | **keep D-C2** until a scene has such a face; the design covers it | W8's loophole is closed either way |
| **D-T6** | A new gesture pushing the same way crosses a far edge again (your rule of 2026-11-14). Keep? | **keep** — the alternative is a hold that outlives the gesture, which you removed | one crossing per gesture |
| **D-T7** | The patents of §3.5 | yours | the Blender row is the way round |

## 6. THE BUILD, IF APPROVED — steps and gates (each one agent run, audited; a look on the device closes it)

| step | what | gate |
|---|---|---|
| **C0** | **An offline round**, as for the charts: the free faces, their layouts and every exit's turn on the 35 shapes and on test scenes (a cube, a heptagon's end, an L-shaped top, a step, a spit body); a walker crossing every edge both ways — no turn without an edge, the turns round every corner adding up; N1 against N2 drawn for the owner | the tables; the owner's look at the drawings |
| **C1** | W11: the entry's first frame measured and its cause named — before anything is built on it | the probe |
| **C2** | Free faces and their layouts in the atlas (pure, `src/input`); the entry by the edge; the exit's turn and the hold computed (W5, W6); the frame's map in the contour's box (W7) | vectors; the three scenes replay unchanged |
| **C3** | The layout kept until an edge (D-T1, W4); the square camera's target on every face (W8) | the close-in runs; the edge-noise run |
| **C4** | The spit on the same rule (D-T2, W2, W3): `spitSide`, the bias and the swap deleted | `mid_check.mjs`: the arrival from a tip turns nothing; the owner's records of 2026-11-14 replayed |
| **C5** | One half-turn event (W1); the mouth as a concave edge (W9) | the ridge and far-edge runs |
| then | step 2.5 of the charts (the old detectors and the switch deleted) | — |
