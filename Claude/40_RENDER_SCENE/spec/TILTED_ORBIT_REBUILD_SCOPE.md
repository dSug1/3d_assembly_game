# THE TILTED ORBIT — REBUILD SCOPE (from `ff2fca2`)

> ⭐⭐⭐ **2026-11-08 — CONTINUE FROM §32** (branch `1.0.107-Close-in-atlas`, rebuilt from `d926b88`): THE CLOSE-IN CHART — far out no gizmo; close in one chart anchored and frozen, the gizmo the place carried in, its region continuous by construction (the singularities outside it, reached by another chart), the place stopped at its edge, the lines short. §31 (the jumps, the bijection) is its reason.

> **Status** · approved by the owner 2026-11-04 (*"proceed"*) · branch `1.0.93from1.0.87-` (renamed `1.0.93from1.0.87-Polar-orbit-improved`; Step 4 on `1.0.94-`, renamed `1.0.94-Polar-orbit-Red-section-fixed`; Step 4b on `1.0.95-`, renamed `1.0.95-Step4c-of-polar-orbit-built`; Step 4c-bis on `1.0.96-Step4c-bis-of-polar-orbit`) · ✅ **Step 0 built** (2026-11-04, §8) · ✅ **Step 1 built**
> (2026-11-04, §9) · ✅ **Step 2 built** (2026-11-04, §10) · ✅ **Step 3 built** (§11) · ✅ **Step 4 built** (§12) · ✅ **Step 4b built** — dx synchronized with the orbit, and the calm (58d86ff) ported (§13) · ✅ **Step 4c built** — the side decides, the parts read at rest (§14) · ✅ **Step 4c-bis built** — THE FACE MAP: the gizmo a
> function of the orbit's angles, the carrier deleted (§15) · ✅ **Step 5 built** (2026-11-05, branch `1.0.99-Polar-orbit-finalized`, renamed from `1.0.99-`) — the face map on the FACES CONTOUR, D3's real depth,
> D5's two sliders (§17) · ✅ **the voids, the edges, the piece's support** (2026-11-05, branch `1.0.100-`, §18 — D3 amended: a void closed on a travel bridged; four root causes from the traversal probes; two more found, the owner's) · ✅ **Step 6 built**, then ⭐ **REDESIGNED** (§20 — the camera's up from the view, a cap left by any edge; ⛔ the hold to be removed, §20.1) · ⭐⭐⭐ **NEXT: THE SECTIONS AS PLANE CUTS** (§21 — approved 2026-11-05, supersedes the facet frames of §5 Steps 6–7; ⛔ not built, awaiting the owner's go) (2026-11-05, branch `1.0.101-`, §19 — the frame turned onto a top / a bottom at its crossing, nothing moving; the far and side edges clamp) — ⛔ no device close on any; the half roll moved to the far edge (Q6, §4.1). ⭐⭐⭐ **THE NEXT STEPS REWRITTEN for THE FACET FRAMES** (2026-11-04, the
> owner — §5 Steps 5–8, §16): the orbit's frame turned at every crossing by the dihedral between the faces. ✅ D2–D5 and I1 decided
> (2026-11-04, §16.1): Step 5 may be built — ✅ built (§17); ✅ Step 6 built (§19). **Next: Step 7.**
> **Reader** · the session that will build it, after the owner has approved this file. Read it whole before the first line of code.

## 1. The goal

Rebuild the **tilted orbit** on top of the orbit as it stands at `ff2fca2`, **step by step**, keeping `ff2fca2`'s good behaviour intact at every step. The
owner: *"The behavior in commit ff2fca2 was the correct one: sections always plane and horizontal/vertical, no jumps, no change of direction, delta position
drives gizmo which drives the orbit of the piece and camera, same direction of gizmo and delta position input. I want to keep those behaviors intact at all
times while proceeding step by step for the build of the tilted orbit."*

The tilted orbit adds to `ff2fca2`:

1. **x / y / z sections instead of polar-radius**: on a top or bottom face the gizmo moves along the world's x and z lines (the sections are world planes),
   not round the vertical axis at a radius as at `ff2fca2`.
2. **The piece and the camera near square to the face in its middle, the full orbit near its edges and through the crossing** (an edge, the zenith).
3. **One behaviour at every distance**: no close-in orbit apart from a far one (`ff2fca2`'s lock, the suspended branch's face-span). Only the near-square
   ⛔ ~~calm's strength depends on the distance~~ — the same calm at every distance (Q3, amended 2026-11-04: a distance-dependent calm curves the approach).
4. **The shell offset**: the piece and the camera ride a smooth SHELL round the assembly; the gizmo stays on the real surface — bumps and holes of the section
   contours (protrusions, gaps, notches under the offset) move the gizmo, never the piece nor the camera.

## 2. The invariants — hold at EVERY step (each step is refused if one breaks)

| | Invariant | Measured by |
|---|---|---|
| **I1** | **The sections are planes — the FACET FRAME's** (⭐ restated 2026-11-04 for the facet frames, §16 — accepted with Step 5): on a face the green (dx) runs along the edge it would cross, the red (dy) square to it, each in ONE plane of the face's frame through the gizmo. On faces square to the world's axes (a box — `Scene_1`) these are the world's planes (`x = c`, `y = c` or `z = c`): horizontal or vertical, as first written. | the constant-input probe: the gizmo within 3 mm of the leg's plane |
| **I2** | **No jumps** — of the piece, the camera, the gizmo's ring, the look point. A step never more than ~2.5× its neighbours' (smooth input). A step in the assembly's depth may move the GIZMO (a break), never the piece nor the camera (the shell, §1.4). | the random-travel probe |
| **I3** | **No change of direction under a constant input.** The same dx (dy) held forever keeps the gizmo going the same way round the SAME section loop — over and over — unless stopped by (a) a camera roll (then the reversed input goes on, §4) or (b) a discontinuity of that section's own contour. ⭐⭐⭐ (§26, 2026-11-06) **No roll exists**: the constant input stops only at an edge whose face is not reachable (T5) or at R4's stop. | the constant-input probe: no REVERSE, no STUCK but (a) / (b), no section change |
| **I4** | **The finger drives the orbit, and the gizmo, the piece and the camera all follow from it** (⭐ reworded 2026-11-04, §16 A1 — since Step 4c-bis the gizmo is a function of the orbit's state, no longer its driver) — the piece and the camera never go one way while the gizmo goes the other, nor on while it is held. | both probes: the piece's direction vs the gizmo's face |
| **I5** | **The gizmo goes the finger's way on the screen** — dx right, the gizmo right; dy down, the gizmo down (the owner, Q1: *"same direction as the input wins"* — over the 2026-10-04 inversion if it still stands at `ff2fca2`). | the probe: the gizmo's screen step · the finger's |
| **I6** | **The camera upright** (the screen's up the world's) everywhere but where §4 says a roll is owed. ⭐⭐⭐ (§26 V2, 2026-11-06) **Upright everywhere, no exception**: the up is the view's own yaw / pitch frame — no roll is ever owed. | the random-travel probe: the up within 5° of the vertical on a wall |

**Every step lands with**: its golden vectors (shown RED against the step before), both probes run far out AND close in AND after random lead-ins, the
numbers recorded in its dossier, and the owner's device look (rule 5). A step that breaks an invariant is reverted, not patched.

## 3. Where `ff2fca2` stands (the starting point — read the code)

> ⚠ (2026-11-04, §16 A2) **THE HISTORY.** The rebuild started here; the code to build on is now §15 (the face map, the shell, the calm, the parts at
> rest) — the carrier, the polar turn and the lock below are deleted.

`render/assembly_wiring.ts`, `input/assembly_orbit.ts`, `input/section_hull.ts`; `DOUBLE_ORBIT_PROTOTYPE.md` up to its `ff2fca2` section.

* **The orbit around the assembly**: dx yaw about the world's vertical, dy pitch, **clamped at ±90°** about the assembly's fixed centre (`st.asm`).
* **The gizmo is a CARRIER on the section's hull**, dropped onto the real surface (`carrierFrame`): dx round the GREEN loop at its height on a side (its
  pace the loop's perimeter / 2π, `greenPace`), turned about the vertical axis at its distance on a top / bottom (`turnAbout` — **POLAR**); dy along the RED
  chain of the yaw plane (the assembly's half-size per radian), clamped at the bottom and top centres; a drop on a face turned away holds it.
* **The piece** on the orbit's direction from the gizmo × the approach's distance (`placeOffset`); **the camera** behind it, upright, its heading the
  orbit's yaw (`assemblyCameraFrame`, `offsetFrame`); the look point the centre far out, the gizmo close in (`lookShare`).
* **Close in, LOCKED** (`nextLock`, `assemblyLockDistM`): the gizmo and its face frozen, the orbit kept within a cone of the face (`lockCone`, `leavesCone`).
* **The approach** (two fingers / A + drag), its coast; **the slide mode** (latches when the contours light, `HOVER.md`) — on ANY body near the piece;
  the solver, the sway, the quads.
* The parts' translation, rotation and alignment are deleted (every press is the orbit's).

## 4. The consequences of tilting — stated, not discovered

> ⛔⛔ **SUPERSEDED (2026-11-06, §26)** — the owner: *"do not roll the camera anywhere"*, then the view by world yaw and pitch, never roll (§26.2). Items 1 – 3
> (the half roll at a top's far edge, the input reversed after it, the quarter roll off a top's side edge) and every *"roll owed"* below are DELETED: a
> top's far wall and its side walls are not reachable across that edge (§26.3 T5); the far faces are reached by dx round the walls. ⭐ Item 5's goal
> stands and is now guaranteed by V2 — a walk round a hexagonal prism never leaves its end upside down.

1. **Over a top or under a bottom the camera ROLLS to stay upside up — AT THE FAR EDGE, never mid-face** (the owner, 2026-11-04: *"the camera roll is
   performed when the gizmo reaches the limit edge at the end of the face, not in the middle of the face travel"*). Across the top the gizmo travels the
   WHOLE face with NO roll: the camera looks down on it with the screen's up along the travel (the way the dy came up), the piece passing straight above the
   gizmo at the zenith with nothing turning. Going on down the far wall without a roll, the world's up would be upside down on the screen. **So the camera
   rolls half a turn when the gizmo REACHES THE FAR EDGE** — the gizmo and the piece WAIT at that edge while the input's travel rolls the camera (branch
   1.0.83's roll: linear, reversible anywhere, a dx held mid-roll); then the gizmo goes on down the far wall, upright. The same under a bottom. ⛔ Not at the
   zenith: a roll in the middle of the face stops the travel there and turns the picture under a gizmo that is on a flat face, with no edge to explain it.
2. **After a half roll the input direction is reversed.** The picture has turned 180°: to go on round the same loop the finger goes the OTHER way (the
   owner: *"a camera roll … rightly requires an inversion of the input direction to continue the same orbit"*). The same finger kept on is HELD at the far edge
   (it would roll straight back); the reversed one goes on down the far side. Lifted, the finger may roll back.
3. **Off a top's side edge (a dx over it onto a wall) a quarter roll, AT THE EDGE** (the owner, Q2: *"at it"*): on the top the screen's up points across it;
   on the wall the vertical lies across the screen. The piece WAITS at the edge while the input's travel rolls the camera a quarter turn, as at the far edge of §4.1;
   then the gizmo goes on down the wall in the SAME plane. ⚠ After a quarter roll the finger's dx is drawn along the screen's vertical: the finger's axes
   turn a quarter with the picture (the dx keeps driving the same loop) — the build states, measures and shows the owner which it is.
4. **The orbit's frame tilts** onto a top / bottom (dx across, dy toward / away): its yaw and pitch must stay the gizmo's world axes there — never a
   camera-derived heading (the suspended branch: the piece went −x while the gizmo went z). ⭐⭐⭐ (2026-11-04, the owner — THE FACET FRAMES) **at every
   crossing the frame turns about the edge crossed by the DIHEDRAL** — *"the pitch rotating shall be done by the value of the angle between the normals
   of the current faces contour and the next faces contour projected in the plane orthogonal to the edge between those contours. This way, if the
   assembly is multi-faceted, the orbit is always in front of the face it orbits around"*: 90° on a box (the top reached as a vertical face is), 60° at
   each edge of a horizontally extruded hexagon. §4.1–§4.3's rolls are the camera's side of the same turns: on a box the half roll after the far edge
   and the quarter roll off a top's side edge; in general, the roll owed is what brings the camera's up back to the world's on a face where I6 asks it.
5. ⭐⭐⭐ **THE SCENE UPSIDE UP ON EVERY FACE THAT IS NOT PURELY HORIZONTAL** (the owner, 2026-11-04: *"the camera roll shall keep the scene upside up if the face is not purely horizontal (for example, a series of walks around the edges of the rectangle faces of an horizontally extruded hexagon could end up with the scene upside down and when the orbit would tilt to be in front of the hexagonal face it should be gravity axis aligned with screen vertical axis)"*). The facet frames are CARRIED from
   edge to edge (parallel transport), so a series of crossings can bring the camera round with the scene UPSIDE DOWN — walking round the rectangle faces
   of a horizontally extruded hexagon and then turning to face its hexagonal end, the carried up can point down the world. So: **on any facet that is not
   purely horizontal the roll owed brings the GRAVITY axis onto the SCREEN's vertical** (the world's down down the screen), whatever the path that led
   there; only on a purely horizontal face (a top, a bottom) is the up the carried one (the screen's up along the travel, §4.1). The roll is taken at the
   crossing that enters such a facet, over the input's travel, the piece waiting (§4.1's rule) — never mid-face. It generalises I6 (*"the camera upright
   everywhere but where §4 says a roll is owed"*) from the walls to every non-horizontal facet.

## 5. The steps (each keeps I1–I6)

Each step is small enough for one device look; the probes at its end are the gate.

**Step 0 — The harness and the baseline.** Move the probes into the repo (`scripts/probes/`: the constant-input probe, the random-travel probe, their
analysers — one Chrome profile per run, removed in `finally`; the window's real viewport; never clamp a leg). Add the screen-direction check (I5) and the
uprightness check (I6). Run them on `ff2fca2` as it is — **far out, close in, after random lead-ins** — and record the baseline here. Expected at `ff2fca2`:
the dy clamped at ±90° (a constant dy stops at the top / bottom centre — `ff2fca2`'s polar orbit, not a fault). Nothing in the product changes, except:
**if the dy's screen direction is opposite the finger's, it is turned (I5, Q1) in this step**, with its vector.

**Step 1 — One behaviour at every distance, and the slide on placed parts.** (a) Delete the close-in LOCK (`asmLocked`, `lockCone`, `leavesCone`, the
lock's verdicts) — the carrier runs at every distance (the owner, Q5: *"deleting the lock at step 1 is cleaner"*); the look point's share kept (it frames the
view, it switches nothing; its slider relabelled). ⚠ Close in the piece then turns about a MOVING gizmo: I2 / I4 checked close in with care (the solver's
contacts). (b) **The slide latches on PLACED parts only** (`hoverCandidates` filtered with `goalLocked` — the suspended branch's Decision 4, the owner: *"slide
shall latch only on placed parts"*; ⛔ a loose piece beside the painting lit the contours). Sliding along the seated parts' contours: **unchanged** (the
owner, Q4). Gate: the probes close in = far out; the slide never latches on a loose piece.

**Step 2 — The shell.** The piece and the camera read the gizmo's FOOT on a smooth SHELL round the assembly — the parts' box offset by
`orbitShellOffsetMm` (60 mm, a slider; the suspended branch's `input/orbit_shell.ts` and `spanAnchor` / `gizmoShare`): flat over a face, round over an edge;
the gizmo itself on the real surface, its ring there. A protrusion, a gap, a notch shallower than the offset moves the gizmo, never the piece nor the
camera (the owner: *"it was good to filter out the bumps due to protrusions or holes on the section contours"*). Brought onto the gizmo within the offset
(at the contact the piece is on the real surface). Gate: I2 across Piece42, Piece44, Piece45, Piece43 and the left column's notches — the gizmo may step,
the piece and the camera never.

**Step 3 — The loops' paces.** Each axis at its LOOP's pace: the perimeter of the assembly's box (the shell's) in the loop's plane / 2π (`loopPace`,
suspended branch) — dx as `ff2fca2` already does on a side, dy the same instead of the half-size per radian. One loop of the gizmo is one turn of the orbit,
for both axes (⛔ suspended branch: at the half-size the gizmo went round a thin section in 208° of orbit, ahead of the piece). Gate: within its ±90°, the
dy reaches the top centre as the orbit reaches 90°.

**Step 4 — World planes on the sides.** The red section through the gizmo the world's vertical plane square to the face's level axis (not the yaw plane at
any heading); the green the horizontal plane at the gizmo's height (as now). The gizmo's motion along the face's level and vertical axes, its carrier on
the plane. Round a vertical edge (dx) the PLANE carried over (I1: the axis moved on turns onto the old normal's opposite, the other kept; the landing searched
along the section only). Gate: I1 on every side, every heading.

**Step 4c-bis — THE FACE MAP (inserted 2026-11-04, the owner; built, §15).** The gizmo a FUNCTION of the orbit's angles, no carrier: the angles' place on
the core box (each side a slice of the turn, the sides' band ±45° of pitch, the top's and the bottom's quarters beyond), the ray along the box face's axis
onto the frontmost of the slide's coplanar regions (holes closed), slowly through an edge (the last / first 10 mm in the last / first 10°), blended across
it (no jump); the sections drawn from the same function. ⚠ What it leaves for the steps below: ONE angle frame for the whole assembly has a POLE —
over a top every yaw is the top centre (the quarters are concentric squares, a dx at ±90° moves nothing) and the pitch stops there; the crossings of §4
cannot be built on it. ⭐ The answer (the owner, 2026-11-04): **the facet frames** — Steps 5–8 below, rewritten (§16).

⭐⭐⭐ **THE NEXT STEPS — THE FACET FRAMES** (rewritten 2026-11-04 for the owner's design, §4.4, §16; ⛔ the first Steps 5–8 — x / z on a top by a tilted
frame re-based at the edge, the two crossings with the carrier, the hull's overhangs — are superseded; they stand in the history of this file). **The
model**: the assembly's FACES CONTOUR — its outline's main faces (facets), each with its normal and its edges to its neighbours; a FRAME per facet (its
normal, and the axes along and across each edge); the orbit's state the current facet, its frame and the orbit's angles in it. Crossing an edge — by dx or
by dy, the same rule — the frame turns about that edge by the DIHEDRAL (the angle between the two normals, in the plane square to the edge): 90° at
every edge of a box (`Scene_1`), 60° round a hexagonal section. So the orbit is always in front of the facet it goes round, and no frame is ever used
near its pole: a turn is taken at every edge, ±45° of a box face's slice — the concentric squares and the dead centre of Step 4c-bis are never reached.
It is the WALK discussed on 2026-11-04 (a point on the shell, its frame carried), discrete on the facets: parallel transport across a polyhedron's edges.

**Step 5 — The faces contour; the face map on facets (no new crossing).** ✅ **Built 2026-11-05 (§17).** Generalise the face map (§15) from the CORE BOX to the FACES CONTOUR:
* the facets: the CONVEX outline of the placed parts (never a re-entrant edge: a constant input turns one way round — I3), its facets MERGED within an
  angle and kept only above a share of real face area behind them (D5) — ⛔ every hull facet a frame would tilt the orbit 15° for 3 cm over a slanted
  block and back (the owner's bounce again — the hull deciding about faces, Step 4c's root cause); on a box exactly the core box's six faces;
* a stack per facet normal (today six world axes), the slide's coplanar regions in that facet's plane (holes closed), the frontmost along the normal;
* dx's slices per facet round the loop it is on (each facet the turn from halfway to each neighbour's normal — Step 4b's facets; on a box 4 × 90°); the
  place across a facet and up it, the slow stretch and the blend at each facet edge (§15 items 4–5);
* the calm's normal the facet's (§13, A6);
* ⭐ **D3 (the owner, 2026-11-04): the gizmo at the REAL depth under it** — over an empty slot its bottom (the closed region still chooses the face and
  keeps the gizmo continuous across the rim; only the depth is the real one); the piece and the camera orbit on (the shell); the APPROACH (A + dy) brings
  the piece into the depth until it collides or meets the orbit's centre.
The orbit stays in the UPRIGHT frame (the world's vertical; no frame turn yet), so tops and bottoms still read as today. Gate: `Scene_1` exactly as Step
4c-bis on the sides (the probes' numbers, both matrices of §15) but over an empty slot (D3: the gizmo at its bottom, the piece and the camera unmoved by
it; an A + dy there goes in to the contact); the vectors on a synthetic horizontal hexagonal prism and a box; I1 in the facet frame.

**Step 6 — The frame turn at a crossing: up onto a top, down onto a bottom.** ✅ **Built 2026-11-05 (§19), redesigned (§20); ⛔ SUPERSEDED with Step 7 by §21 (the sections as plane cuts — approved, not built).** At a top / bottom edge's threshold the orbit's frame TURNS about the edge by
the dihedral (90° on a box): the top becomes a face of the new frame, orbited as a vertical face is — a dx along the edge, a dy across the top toward the
far edge, the sections the facet frame's planes (I1: on a box the world's x / z lines). The turn RE-BASES with nothing moving: the piece's direction is the
same vector read in the new frame's angles (the spring, the lag, the leash re-read), the gizmo's place taken over by `mapAngles` / `syncAngle` (as after
the slide — no jump). The camera ROLL owed at the turn is the orbit's heading off the edge's normal (none when square to the edge, at most half a slice),
taken over the input's travel, the piece waiting (§4.1's rule). A margin against a finger dithering on the threshold (no turn back before it is passed
back by a few degrees). The finger's axes LATCHED for a drag (and its coast), each a whole screen axis (§6). **Still clamped**: on the top the dy stops at
the far edge and the dx at the side edges (no second crossing, no half / quarter roll yet). ⭐ **The bottom a face to orbit as the others** (D2, the
owner: *"remember that the floor can be crossed by the camera and is invisible from below"*): reached and orbited exactly as the top — the piece and the
camera under the floor's top; ⚠ checked here: the play volume and the solver's contacts never stop the orbited piece's orbit there. Gate: I1–I6 on a top reached at
several headings, the clamp the only stop; a dy back down the edge turns the frame back with nothing moving. ⭐ **To check here (§18, found by the
traversal probes 2026-11-05)**: **§18-C2** — over the top at ~70°, close in, a dy against Piece44: the slide's yaw no longer swings ±7.5° an input
frame (the camera 33 mm back and forth; `b_d17c`, seed 17 `DIAG`, frames ~2086–2106) — no back-and-forth there; **§18-C3** — the camera's roll under the
bottom (−64° … −73°) within I6, and a dx at ±90° moves the gizmo; **§18-C6** — the matrix re-run.

**Step 7 — Crossing on, every edge the same rule.** Open the clamps: over a top's FAR edge (the frame turns again; the camera's half roll there, §4.1;
> ⛔⛔ **SUPERSEDED (2026-11-06, §26)** — no frame turn, no roll: a face is reached only where the view is continuous (T5); its §18-C4 check (a void open
> on a section's travel) is §27.2's Gz0 (a GAP — the orbit tilts on — or a DEPORTED face).
the input reversed after it, §4.2 — the same finger held at the edge, the reversed one goes on down the far side) and over a top's SIDE edge onto a wall
(the quarter roll, §4.3, the piece waiting); on a non-box contour each crossing turns by its own dihedral, the roll owed the one that brings the camera's
up back to the world's where I6 asks it — ⭐ on EVERY facet that is not purely horizontal, gravity onto the screen's vertical whatever the path (§4.5, the
owner: a walk round a horizontal hexagonal prism's faces must not leave its hexagonal end upside down). Round a VERTEX the frame comes back turned by the vertex's angle defect (90° at a box's corner, a diagonal path):
the frame snapped to the facet's own axes on entering it, the roll owed taken in that crossing. Gate: a constant dy loops the vertical section (stopped
only by the far edge's roll); a constant dx started on a top loops its section (stopped only by the side edge's roll); I1 throughout; the hexagonal prism
looped both ways in the vectors; ⭐ a long walk round the prism's rectangle faces, then onto its hexagonal end: the scene upside up there (§4.5).
⭐ **To check here (§18)**: **§18-C4** — a void OPEN on a section's travel (the owner's attachment 1: a notch open on the red's): the red no longer runs
straight up into the air — at the notch's real edge the orbit tilts and the gizmo follows the red onto the next face; a void CLOSED on the travel still
bridged straight (§18, `void_bridge.test.ts`); **§18-C6** — the matrix re-run.

**Step 8 — What the faces contour misses; the shell on the facets.** ⚠ (2026-11-04) See also the SLIDE wedged under an overhang (`HOVER.md` §0, item 21) —
> ⭐⭐ **STATUS (2026-11-06, §27)**: ✅ **the shell on the facets** — the facets pushed out to the parts' support (`Facet.es`), the piece on it (P1);
> ✅ **§18-C1** — the piece no longer placed from the gizmo's point (the shell: no hop at a protrusion, no solver); ✅ **mostly, two regions competing for
> a facet's plane** — the DEPORTED face (§27.2 Gz0: every depth of the facet's normal is a face; the largest region still picks the track's plane).
> ⏳ **Open, for a non-box assembly**: a face beyond the merge angle of every facet, an undercut / the inside of a U, an overhang's underside (D2), and the
> view's jumps at a slanted shape's three-face corners (§26.7).
a future improvement of the slide, not of the orbit; a candidate gate here: *no slide ends where no way out is free*. What the facet frames' face map does
not reach or reads wrongly (A5): a face more than the merge angle off every facet (`MAP_AXIS_DEG` today); a face no facet's ray reaches (an undercut, the
inside of a U — the orbit goes round the convex outline, the ray lands in a pocket only where it opens toward a facet); an outline narrower at a height
than its facet (the gizmo in the facet's plane beside the real face, no part there); a ray from below on an overhang's underside (D2); two regions
competing for a facet's main plane. ⛔ (`shadowBridgeMm`, `shadowStepMm`, R3, R4 belonged to the deleted hull.) And THE SHELL on the facets: today the
parts' BOX offset (Step 2) — round a hexagon the piece would ride a box's corner past the slanted facets; the offset of the faces contour instead, when a
non-box assembly exists. Gate: I1–I4 across `Scene_1`'s protrusions and the prism's; the gizmo's DEPTH steps accepted (the shell, Step 2).
⭐ **To check here (§18)**: **§18-C1** — close in, the piece no longer placed from the gizmo's one point: (a) at a protrusion's depth step (Piece9's
edge on the −x side, 95 mm) the piece's place does not jump and the solver never freezes with the finger's orbit running on (`b_d17c` frame ~836,
`b_hc` ~1681: 17 of §18's 36 blockages); (b) a part beside the gizmo (Piece44 over the top) is gone over, not run into (13 of the 36). The
proposal (§18): the place along the ray where the piece clears the parts' boxes inflated by its own by the approach's distance (sphere-traced, no
collision query). ⚠ Its cost read on the iPhone. **§18-C6** — the matrix re-run, the blockages near 0 but the touching ones the player's.

**Step 9 — Near square in the middle, the full orbit at the edges, at every distance.** The piece's SHOWN direction calmed toward the face's normal in
> ✅ **(2026-11-06)** the calm IS §26.2 V3's profile (the face's own loops, the yaw and pitch leans to the bisectors) — the same at every distance.
its middle (a share of the orbit's angle), whole within an edge zone and through every crossing (the suspended branch's fourth pass, its sliders), the shares
FOLLOWING their targets (never read at once — a column of another height moved the camera 15 cm). ⭐⭐⭐ **THE SAME CALM AT EVERY DISTANCE** (the owner,
Q3 amended 2026-11-04: *"modify the scope Q3: same calm at every distance"*) — ⛔ the attenuation by distance (and 58d86ff's gate, whole within 3.6 m, none
from 5.4 m) turned the piece's direction while A + dy approached: the approach curved (*"why is there a 2D curve not straight when I approach the piece with
A + dy"*). Gate: I2 above all — the calm never makes a jump at an edge, a face switch, the zenith or under an approach. ✅ Built early, in Step 4b (§13);
⭐ (2026-11-04, §16 A6) its targets read the face map's place since Step 4c-bis (the side's axis, the span across the core box, the height in the box), and
the FACET's normal and span from Step 5.

## 6. Lessons carried from the suspended branch (`1.0.92-Tilted-orbit-suspended`) — read before building

* ⭐⭐⭐ (2026-11-04, the rebuild's own, §16 A7) **DERIVE the gizmo, do not CARRY it**: a state that drifts, waits, is held and re-syncs was the root of
  the device glitches of Steps 2–4c (the carrier); Step 4c-bis made the gizmo a function of the orbit's state. ⚠ Its limit: one angle frame has a pole —
  a state is still needed where a function of the angles is singular, and the facet frames (§5, Steps 5–7) are that state, turned at every edge.

* **The finger's axes latched for a drag** (and its coast), each a WHOLE screen axis — ⛔ re-read every frame, a level axis seen end-on handed the dx to the
  pitch; ⛔ a blend between screen axes sent a pure dx to both, diagonally.
* **Round an edge the PLANE carries over**: the axis moved on turns onto the old normal's opposite, the other is KEPT; the landing searched ALONG the section
  only — ⛔ the next face's axes read again, ⛔ its nearest point anywhere (40 cm away under Piece42).
* **The gizmo and the orbit move together or not at all**: held by a part or at the section's outline, the orbit is held too (⛔ the orbit went on alone:
  later the gizmo was carried 20 cm, the camera 1.4 m in a frame). No "catch-up carry" that moves the gizmo off its plane.
* **The tilted frame's heading the world's x or z** (⛔ the camera's heading: the piece and the gizmo parted). ⚠ A frame re-tilted at a pole (`antiPoleQuat`)
  and kept through a long drag was never solved (R2) — prefer a frame taken from the gizmo's loop (its held axis as the frame's up: the piece in front of any
  face on the frame's equator — no pole).
* **The probes lie in known ways**: a leg clamped at the window's edge sends one move backwards (read as a rocking roll); the real viewport is 734 px high
  in the 830 px window; a mean of neighbours reads an every-other-frame input as a jump — compare with the LARGEST neighbour; a probe's recorder that reads
  a field the code under test lacks records nothing.
* **Open there** (R1–R6, `queue_notes/FACE_SPAN_2026-11-02.md` on that branch): R1 is now decided (§4.3), R3 / R4 belong to Step 8, R5 to Step 1 (b).

## 7. The owner's decisions (2026-11-03)

* **Q1** — the dy's direction: *"same direction as the input wins"* → I5, Step 0.
* **Q2** — the quarter roll off a top's side edge: *"at it"* → §4.3, Step 7.
* **Q3** — the calm: ⭐⭐⭐ **AMENDED 2026-11-04: *"modify the scope Q3: same calm at every distance."*** (a calm that changes with the distance curves the
  A + dy approach). ~~*"near-square calm at every distance, probably attenuated with a proportional gain when the distance increases"* → a floor of about
  half~~ — superseded.
* **Q4** — the slide: *"implement the modifications we did to avoid the issue of sliding on un-seated part. For sliding on seated parts contour, no change"*
  → Step 1 (b).
* **Q5** — the lock: *"deleting the lock at step 1 is cleaner"* → Step 1 (a).
* **Q6 (2026-11-04)** — where the half roll happens: *"the camera roll is performed when the gizmo reaches the limit edge at the end of the face, not in
  the middle of the face travel"* → §4.1, Step 6 (the zenith roll moved to the far edge).
* **The shell offset**: *"include the concept of the shell offset: it was good to filter out the bumps due to protrusions or holes on the section
  contours"* → §1.4, I2, Step 2.

## 8. Step 0 — built (2026-11-04)

**The harness** — `scripts/probes/orbit_probe.mjs` (the probe: `MODE=const LEGS=…` or `MODE=random SEED= PRESSES=`, `APPR=` an approach first, `PRE=` a
lead-in; one move per rendered frame; the page's own viewport; a leg ENDS at its edge, never clamped; its own Chrome profile, removed) and
`scripts/probes/analyse_orbit.mjs` (I1–I6 per leg). Run on the dev server (`npm run dev:usb`):

```bash
MODE=const APPR=0   OUT=far  node scripts/probes/orbit_probe.mjs   # far out: L 1400, U 380, R 1400, D 380 px
MODE=const APPR=250 OUT=near node scripts/probes/orbit_probe.mjs   # close in, after an approach
MODE=random SEED=3 PRESSES=6 OUT=rand node scripts/probes/orbit_probe.mjs
node scripts/probes/analyse_orbit.mjs <PROBE_DIR or the OS temp dir>/orbit_probe/far.json
```

**The product change** — I5 (the owner, Q1): around the assembly the finger's dy enters the orbit REVERSED (`orbitDy`, `input/assembly_orbit.ts`) —
finger down, the pitch down, the gizmo down the face. ⛔ The 2026-10-04 inversion stood around the assembly: **29 of 30** moving frames had the gizmo
against the finger. After: **4 of 908** far out (at a held drop and its jump), 2 of 86 close in (the slide), 2 of 79 at random — the rings' sense kept.
1596 vectors (+1, red against `bb85a7f`).

**The baseline at `ff2fca2`** (after the dy's turn; Scene_1, headless, 3 px a frame):

| | far out | close in (APPR 250) |
|---|---|---|
| dx left / right, 1400 px | ✅ loops the walls in ONE horizontal plane, both ways (−z → ±x → +z …), no off-section, no reverse; the gizmo steps 15–19 mm at protrusions (its own jumps, 15) | the SLIDE latches at once (on Piece43, a placed part) and stops at the hosting face's edge (*"hover: at the edge of the hosting faces"*) — STUCK; the camera's blend into the slide view 48 cm over a few frames |
| dy up / down, 380 px | ✅ straight up / down the face (plane x = const, tilt 0°); ⛔ at the bottom / top the POLAR clamp: *"the gizmo's drop lands on a face turned away from the piece — held"* — the gizmo held while the orbit goes on: **the piece behind its gizmo's face in 691 frames** (I4), off-section 38, stuck 7 | inside the slide |
| a dx at the bottom's centre | ⛔ nothing moves (polar: no radius to turn about) | — |
| page errors | 0 | 0 |

⇒ Steps 1–5 remove the polar clamp's I4 breaks and the close-in latch's stops; the dx's horizontal loop is the reference every later step keeps.

## 9. Step 1 — built (2026-11-04)

**(a) The close-in lock deleted** (Q5): `nextLock` and its vector gone; the carrier runs at EVERY distance — the approach no longer holds the gizmo
(close in, 102 held frames at Step 0's approach → 0). `st.asmLocked` is now the SLIDE's hold only (the slide holds the gizmo; leaving it finds the carrier
again on the red section — *"orbit: off the slide — the gizmo on the sections again"*); `lockCone` / `coneClamp` / `leavesCone` serve the slide alone. The
look point's share kept, its slider relabelled *look at the gizmo within (m)* (`assemblyLockDistM`, the name kept). **(b) The slide latches on PLACED parts
only** (Q4): `hoverCandidates` filtered with `goalLocked`; sliding along the placed parts' contours unchanged. 1597 vectors (−1 the lock's, +2; both red
against `feb9c05`).

**The probes** (constant legs, Scene_1; the approach's px → the piece's distance from the gizmo):

| approach | piece–gizmo | result |
|---|---|---|
| 0 (far) | 3.0 m | = Step 0: the dx loops the walls in one plane both ways; the dy's polar clamp (piece behind its face in the R leg, 711) — Steps 3–5 |
| 110 px | 0.55–0.63 m | = far out, exactly (the same flags, the same counts) ✅ |
| 135 / 150 px | 0.08–0.30 m (the old lock's zone) | ⛔ **the piece meets the parts**: the collision solver moves the pitch at a contact (v 0.686 → 0.59) — the gizmo leaves its plane (y 0.035 → 0.110: off-section ~2000 frames, reverse 21–29, the wall roll 15–60 frames); a part STOPS the orbit (c3R held at yaw −28.86 to the end). No piece jump. |
| 250 px (to the contact) | — | the SLIDE latches at once on Piece43 (a placed part — kept, Q4) and stops at its hosting face's edge, as at Step 0 |

⇒ ⛔ **OPEN for Step 2**: close in, the piece's path round a MOVING gizmo crosses the parts' protrusions — what the lock hid by holding the gizmo. The shell
(Step 2: the piece and the camera on the gizmo's FOOT on a smooth shell 60 mm off the box) is the step meant to carry the piece clear of them; Step 2's gate
adds these two probes (135 / 150 px): no off-section from a contact, no stop but a section's own discontinuity.

## 10. Step 2 — built (2026-11-04)

**The shell** (`input/orbit_shell.ts`, ported from the suspended branch): the piece and the camera read the gizmo's FOOT (`shellAnchor`) — the piece's
place on the smooth shell round the placed parts' box (`shellBox`, `shellLevel`: flat over a face, round over an edge) less the approach's distance — so
the piece is `foot + u·d`; the gizmo, its ring, stay on the real surface (`st.asmGizmoAt`). Beyond `orbitShellOffsetMm` (60 mm, slider *the shell's
offset*) the piece is on the shell; within it, onto the gizmo (`gizmoShare`). ⭐ **The share read from the piece's SURFACE**: its REACH toward the gizmo
(`pieceReach`, the support of its hull along −u) taken off `d` — ⛔ built first from its centre: at the contact `d` is the piece's thickness (43 mm), the foot
stood 81 % on the shell, the piece 14–30 mm off the face: **the slide never latched** and the piece jumped 40 mm / the camera 25 cm with the held gizmo (probed);
⛔ a cap of the foot's shift at the offset did not cure it (reverted). Under the slide: the slide's gizmo itself (the slide unchanged). 1602 vectors (+5).

**The probes** (constant legs; Step 1 → Step 2):

| approach | piece–gizmo | Step 1 | Step 2 |
|---|---|---|---|
| far (0) | 6.0 → 6.3 m | off-section 17, reverse 1, piece jumps 0 | the same (the piece on the shell: +0.3 m where the gizmo is recessed) |
| 110 px | ~0.6 m | = far | = far |
| 135 / 150 px | 0.08–0.5 m | ⛔ off-section ~2000, reverse 21–29, wall rolls 15–60, an orbit stopped by a part | ✅ **= far** (off-section 17, reverse 1, no piece / camera jump) — §9's open item closed |
| 250 px (contact) | 43 mm | the slide latches on Piece43 | the slide latches on Piece43 (19.1 mm), as before |
| random, 140 px | — | — | gizmo jumps 12, piece / camera 0 (the shell filters them) |

⚠ Still open (Steps 3–5): the dy's polar clamp at the top / bottom (*"the gizmo's drop lands on a face turned away from the piece — held"*: the piece behind its
face ~660–730 frames, far and close alike).

## 11. Step 3 — built (2026-11-04)

**The pitch at its loop's pace** (`redPace`, `input/section_hull.ts`): a pitch step asks of the carrier what is LEFT of the red chain toward the end it goes
to (the top centre up, the bottom centre down) over what is left of the pitch to ±90° — in step with the pitch that is the chain's length per half turn
(`total / π`, as dx's `greenPace` is the green loop's per turn); out of step it catches up without a jump, and **the gizmo reaches the top centre exactly
as the orbit reaches +90°, the bottom centre at −90°**, whatever it started from (⛔ `ff2fca2`: the assembly's half-size per radian — from the boot place a
dy reached +90° with the gizmo half way up the face, y 0.27 m of 0.5). ⭐ The ends kept 1 mm inside the chain (`RED_END_INSET_M`) — ⛔ probed: in Scene_1
the top centre (the vertical through the assembly's box centre) lies exactly on the painting's back top edge (z −0.0175): the drop grazed it and found
nothing, the gizmo held 29 mm short, silently. The probe's `DROP=1` re-casts the carrier's drop each frame (how it was found). 1605 vectors (+3).

**The probes**: long dy legs (700 px, up / down / down / up), far and at 140 px — **every leg ends at the top / bottom centre as the pitch reaches its
limit**, on the top / bottom face; no jump; the piece behind its face 0 (Step 2: 264–279 on these legs). The standard legs: the piece behind its face
**731 → 3**; ⚠ the dy (380 px) now REACHES the top centre, where the clamp holds it (until Step 6) and the next dx stalls there — the top's polar turn has no
radius at its centre (the baseline's *"a dx at the bottom's centre moves nothing"*, now reached from the top): off-section 17 → ~1160 (the stall's
jitter on the top), stuck. ⇒ Step 5 (x / z on a top, no polar) removes it.

## 12. Step 4 — built (2026-11-04, branch `1.0.94-`)

**The red section a WORLD plane, square to the face's level axis** (`redHeading`, `snapHeading`, `input/section_hull.ts`; the carrier keeps its plane's
`heading`): on a side the vertical plane along the face's normal snapped onto a world axis — `x = c` on a ±z face, `z = c` on a ±x face — so a dy goes
straight up / down the face WHATEVER the piece's heading; ⛔ `ff2fca2`: the yaw plane at the piece's heading — at a heading along the face the dy slid the
gizmo ACROSS it (probed: 136 mm sideways down the painting's back face). The plane read from: the gizmo's face at the start; the GREEN edge the carrier is on
after a dx — round a vertical edge it turns with the face (the plane carried over); over a top / under a bottom (or no face) the yaw snapped (until Step 5).
A dy over a top re-takes the yaw's world plane — only where it keeps the carrier within 10 mm (`RETAKE_M`; ⛔ through a thin top's edge, past the gaps of the
unplaced pieces, it put the carrier on another part 68 mm off: the gizmo jumped 270 mm). ⭐ **The hull wholly BEHIND the axis** (`facingChain`): clipped at
its middle — ⛔ `null`: in Scene_1 the axis lies on the painting's back face (z −0.0175), a world plane `x = c` seen from +z had no facing area, the carrier
kept a stale plane and every drop was held (the gizmo frozen on the back face — found by the probe, red against the first build). 1610 vectors (+5; 7 red
against Step 3). The probe records the carrier's `heading` (`cs[4]`).

**The probes** (Step 3 → Step 4):

| | Step 3 | Step 4 |
|---|---|---|
| sides at 12 headings (U 150, then × 12: L 70, U 80, D 160, U 80) | the dy legs tilted up to 44° off a world plane; off-section 1359; the gizmo against the finger 103 of 1149 (≈ 65 on the sides) | **every dy leg down a side in a world plane (0°)**; off-section 531; against the finger 98 of 731 (≈ 22 on the sides, the rest at a held top / bottom) |
| the piece behind its face | 345 on the sides | 240 on the sides; ⚠ +500 at the top / bottom: the dy now reaches them in its world plane, where the polar clamp holds (Steps 5–6) |
| standard legs far / close in | off-section ~1160, the piece behind 3 | off-section 899 / 901, the piece behind 15 / 23 (the top's polar turn) |
| random (seeds 3, 7) | — | off-section 0, reverse 0, stuck 0; the piece behind 0 / 4; no piece / camera jump |

⚠ Left for Step 5: the top's polar dx — a turn about the axis, whose planes miss a thin top (the painting's top strip is 33 mm deep, the axis on its back edge).

## 13. Step 4b — dx synchronized with the orbit — built (2026-11-04, branch `1.0.95-`)

**Why.** The owner, on the device (`1.0.94-`): *"Sometimes, not all the times, when i orbit on dx, the red section disappears after the crossing of the edge
… And then when i continue, the gizmo snaps back to the red section when it appears around the previous edge"*. The cause (probed, then replayed offline on
the placed parts): dx BY DISTANCE (`loopStep`, `greenPace`, 2026-10-29) is only loosely in step with the yaw — a face's share of the loop's length is not its
share of the turn, and a dy onto another height's loop re-finds the carrier from its point — so the carrier reaches some corners EARLY and waits there for the
next face to face the piece. Re-found each frame from its point (`nearestOnChain`), it came back one rounding step short of the corner (0.4976450641787913
against 0.49764506417879134), read as INSIDE the edge turned away, and ran free along it: every drop turned away (the HUD's *"a face turned away — held"*),
the gizmo and both lines held at the corner (the red along the face just left, edge-on: gone from view), then a snap when it landed. ✅ Fixed first on
`1.0.94-` (`ccf2c80`: a position within 1e-9 of a corner is ON it). Then the owner: *"why the gizmo cannot be synchronized with the orbit? I am ok if the
linear speed of the gizmo is not constant"*.

**As built** (`input/section_hull.ts`, `render/assembly_wiring.ts` `onGreen`):

* ⭐⭐⭐ **The place from the yaw alone** (`loopAtYaw`): the green loop at the gizmo's height cut into FACETS (its edges in line — one normal — are one facet:
  ⛔ a 0.9 mm sliver beside the funnel's 100 mm side read as a full turn, the slices no longer tiled the circle, a 49 mm jump for 2.9°, probed); each facet
  owns a SLICE of the turn, from halfway between its normal and the previous facet's to halfway between its normal and the next one's; inside its slice the
  carrier crosses the facet linearly with the yaw. ⭐ The same yaw is always the same place (nothing to drift), a corner is reached exactly as the yaw crosses
  into the next slice, and **the facet under the gizmo always faces the piece** (the yaw within half an exterior angle of its normal) — no corner wait, no
  face turned away, no rounding slip. ⚠ The speed along the loop is uneven, by the owner's leave: on `Scene_1`'s painting the 50 cm front and the 33 mm side
  each get ~90° (5.4 against 0.4 mm per degree).
* ⭐⭐ **Out of step, no jump** (`syncStep`, `yawAtLoop`): after a dy onto another height's loop, the boot or the slide, the carrier is not where the yaw
  says. The gap is read as an ANGLE (the carrier's own yaw, `yawAtLoop`, the inverse) and closed in that angle — ahead, its yaw turns at 0.5 of the finger's
  step, behind at 1.5 (`SYNC_CATCH`) — so it never jumps, never stops, never goes against the finger, and closes a 20° gap in ~40° of drag whatever the
  face's width. ⛔ First built as "ahead: wait, behind: hurry" in arc length — the composed vector caught it: the gizmo held ~150° while the orbit went on
  (I4), and on a 33 mm side a gap closed by millimetres per 90°.
* The by-distance rule (`loopStep`, `greenPace`, `greenFaces`) is unwired, kept for the fallback below (declared debt). dy (`redPace`), the red plane
  (Step 4) and a top / bottom (the polar turn, Step 5) unchanged.

**Vectors**: `tests/section_hull.test.ts` + 4 (the place from the yaw, the split face, the facing edge on 40 random convex loops, the step in and out of
step on the square and the painting's shape) and the wiring; 4 RED against `1.0.94-`. **1614** (1610 + 4).

**The probes** (Step 4 → Step 4b):

| | Step 4 | Step 4b |
|---|---|---|
| sides at 12 headings | jumps piece 1 / camera 5 / gizmo 19; off-section 285; stuck 40; **the piece behind its face 2000**; against the finger 10 of 504 | jumps 0 / 0 / 19; off-section 365; stuck 7; **the piece behind 161**; against 14 of 1263 |
| standard legs far / close in | gizmo jumps 18 / 18; off-section 899 / 901; the piece behind 15 / 23; against 18 / 16 | 14 / 13; 899 / 899; 12 / 20; 18 / 37 (⚠ the +21: one dx leg on the TOP — the polar turn, Step 5; the state it is reached in differs) |
| random seeds 3 / 7 | piece behind 0 / 4; against 7 / 6 | 0 / 3; 7 / 5 |
| dx only at mid-height, both ways (4200 px) | clean | clean (a camera flag at a dy's release, before any dx) |

⚠ Left: the top's polar dx (Step 5); the piece straight below / above (v at 0 / 1: every edge "faces", a drop's cos(±90°) of 6e-17 reads "turned away" —
Steps 5–6); a dy from a top whose snapped plane runs 1.5 mm behind the painting's back face — the drop lands 246 mm off on the far side (likely the owner's
*"the gizmo and sections can be thrown off to a face opposite to the piece due to slanted geometries"*, not yet diagnosed).

**⭐⭐⭐ THE CALM, PORTED** (the owner: *"the behavior to avoid seeing the gizmo close to vertical edges of vertical face at a too slanted camera view by
modulating the slide of gizmo around the middle of the face … i am referring to this calm behavior of commit 58d86ff… It shall stay"*). It was the
face-span's FOURTH PASS (`58d86ff`, 2026-11-03, on `1.0.92-Tilted-orbit-suspended`, `queue_notes/FACE_SPAN_2026-11-02.md` there) and went with the rebuild
from `ff2fca2` (planned back as Step 9) — now in `input/orbit_calm.ts`, wired in `render/assembly_wiring.ts` (`calmDir`, `calmFrame`):

* `edgeShare`, `shownDir`, `calmWeight` are 58d86ff's, unchanged: the piece's SHOWN direction (the piece, the camera, the approach, the solve — `dirAt`) at
  a quarter of the orbit's angle off the face's normal in the middle of a face, rising by a smoothstep to the whole angle within an edge zone (25 % of the
  run, 3 cm at least), whole at the edge and through the crossing and on a face too thin for two zones (the 33 mm side, a top); the gizmo is still moved by
  the orbit's own direction. ⛔ First ported with 58d86ff's distance gate (whole within 3.6 m, none from 5.4 m) — it curved the A + dy approach; ⭐ now **the
  same calm at every distance** (Q3 amended; `calmWeight`, `calmEngageM` and the distance slider deleted). The seven sliders in CAMERA ORBIT AROUND CENTER
  › FACE-SPAN ORBIT SHARE, their keys and defaults 58d86ff's.
* ⭐ **The runs from the carrier**: dx's — the facet of the green loop FACING the way of the real face under the gizmo (the accepted drop's normal, within
  45°), nearest it (`facetRunToward`; ⛔ the nearest facet alone: where a part sticks out of the front, 0.145–0.217 m, the hull bridges to it and the gizmo
  on the real front is inside it, nearer the BACK — the calm took the back's normal, the camera swung behind the painting, 121° off the front, probed); dy's
  — the in-line stretch of the red chain (`chainRun`).
* ⭐ **Eased, never read at once** (`CALM_TAU_MS` 120 ms — Step 9's *"the shares FOLLOWING their targets"*): the face at a height changes with the height,
  which 58d86ff's coplanar region never did. Both shares whole: a new normal taken at once; else the calm only as far as the eased normal has caught up
  (none beyond 30°, whole within 5°, `alignedShare`; ⛔ a share calming while the normal swung across from a stale face 175° away: a 271 mm camera jump).
* ⭐ **The camera's heading turned as the calm turned the direction** (`calmHeading`; ⛔ the orbit's yaw with the calm's direction: the camera's up built from
  another heading — the camera ROLLED on a wall, 222 frames over 5° on one close-in dx leg). Under the slide's lock: the orbit's yaw, as before.

Vectors: `tests/orbit_calm.test.ts` 11 (58d86ff's five unchanged, the runs, the ease, the aligned share, the camera's heading, the wiring and the sliders);
RED against Step 4b (the module absent). **1625** (1614 + 11).

**The probes, close in (APPR 140)** — the view (camera − gizmo) off the face's normal on the painting's front / back, min / mean / max:

| | Step 4b | + the calm |
|---|---|---|
| dx at mid-height: the face's middle | 35 / 55 / 67° | **17 / 28 / 44°** |
| …near its edges | 68 / 73 / 79° | 29 / 53 / 69° |
| sides at 12 headings: the middle (mean) | 32° | **20°** |
| far out (6 m): the middle (mean) | 58° | 58° (no calm there) |
| jumps piece / camera, close in (dx, sides, standard, seeds 3 and 7) | 0 / 0 | 0 / 0 |
| rolled on a wall: dx / sides / standard | 1030 / 142 / 12 | **0** / 88 / 8 |

⛔ Not judged by a hand: the defaults are 58d86ff's (*"ok as recommended"*), the ease (120 ms) and the alignment (30° / 5°) new.

**⭐ The fallback, if the owner does not like `1.0.95-`** (the owner: *"capture in the md file the alternative improvement you suggested, as a possible
fallback"*), as proposed: *"A possible improvement (not built): give dx the same catch-up Step 3 gave dy. Step 3 paces the gizmo by what's left of the red
line over what's left of the pitch, so it reaches the top exactly as the orbit hits +90°. For dx, the gizmo would be paced by what's left of the current face
over what's left of the turn until the next face starts facing the piece. It would arrive at each corner exactly as it should, never wait, and never drift,
while keeping an even speed within a face."* — `loopStep`, `greenPace`, `greenFaces` are kept (unwired) for it.

### 13.1 The bounce — fixed (2026-11-04, `1.0.95-`, after `ccc0852`)

The owner, on the device: *"a dx orbit to the right in the middle of the blue part's front face: after the gizmo has crossed the grey part to the right, it
seems to bounce back when it reaches the vertical edges"* (+ *"Reproduce with random travel and check what is the bug"*). Reproduced close in (APPR 140,
dx at 0.466 m): the gizmo reaching the front's right end, the PIECE went back 5 cm in x and the CAMERA back 70 cm and up, for ~12 frames, under a pure dx
to the right. ⭐ **The calm's VERTICAL share was the cause, three ways** — each found by the next probe:

1. **dy's run read per small face**: the in-line stretch of the red chain under the gizmo — on the small slanted block at the front's top-right end (normal
   (0.26, 0, −0.96)) a few cm, the share whole (1) against 0.35 on the front: the piece swung up to the orbit's whole pitch, and at the same yaw back in x.
   Then **the wall under the gizmo** (its SIDE edges bottom to top): its top differed from the front's plane to the side's at the same height — 0.33 → 1
   round the corner. ✅ **dy's run is the gizmo's HEIGHT within the placed parts' box** (`shellOf` — one top and bottom on every face): a pure dx never
   changes it.
2. **dx's run per facet**: ✅ the SIDE of the green loop — consecutive facets facing one world side (headings snapped to the nearest axis, Step 4's red
   plane): the slanted block, a bridged protrusion, a sliver belong to the front's run; the calm's normal is that side's world axis (`facetRunToward`).
3. **Both shares released at a corner** while the normal turned (`alignedShare` on both): ✅ the HORIZONTAL share only — with it whole the face's normal
   cancels out (the pitch is the world up's, the heading the orbit's own), so the vertical calm never waits on it, and the normal is taken at once.

⭐ And **the calm fades toward straight above / below** (`poleWeight`: whole under 60° of pitch, none from 85°) — ⛔ at the bottom pole a stale side normal
with a vertical share of 0.53 bent the piece off its gizmo's face (657 frames "behind", seed 7 × 8 presses).

**The probes — the same code, the calm on and off** (`?faceSpanShareH=1&faceSpanShareV=1` — the probe's `URL`):

| | calm off | calm on |
|---|---|---|
| the bounce: frames the piece / camera go back under a dx right (0.466 m close in; 0.36 / 0.43 m at 4–5 m) | 0 | **0** (76 at `ccc0852`) |
| dx close in: the view off square in the face's middle (mean) | 54.9° | **25.6°** |
| sides at 12 headings: the middle (mean) | 32.2° | **17.3°** |
| rolled on a wall: dx close in / sides / dx at 4–5 m | 1032 / 148 / 1086 | **0 / 78 / 0** |
| random seeds 3 / 7 (8 presses), standard legs: the piece behind | 148 / 7 / 20 | 146 / 8 / 20 |

⚠ A dy (not a dx) at 4 m: the vertical share follows the gizmo's height, eased 120 ms — at the finger's release the piece settles ~2° on (two flags, the
calm off none). Vectors: `tests/orbit_calm.test.ts` 12 (the bounce, the pole, the vertical share never aligned — RED against `ccc0852`). **1626**.

### 13.2 The piece's lag behind the ring — two sliders (2026-11-04, `1.0.95-`)

The owner: *"why there is a lag of the piece vs. gizmo during dx input? Is it due to green piece inertia"* — no: the ring is drawn at the gizmo's exact
point, while the piece and the camera follow it twice smoothed — the gizmo's position (its foot on the shell) eased 90 ms, and the orbit's angles on a
critically damped spring of 30 ms (half `boxSmoothMs`): ~100–120 ms behind the ring. *"add a slider for gizmo position and one for orbit angles"* → CAMERA
ORBIT AROUND CENTER: **`gizmoEaseMs`** (90, the former `GIZMO_TAU_MS`) and **`orbitSpringMs`** (30, the orbit's spring and the travel counts that share it —
the piece's entry, its aim, the centre's return; the hover and the rig's share keep `boxSmoothMs`). 0: at once. Defaults unchanged. `tests/orbit_lag.test.ts`.
⭐ The owner: *"set the default gizmo ease at 55 ms"* → `gizmoEaseMs` **55**. ⏳ Next (the owner): *"Instead of a ms ease, can you reject jumps of gizmo?"*

### 13.3 The same calm at every distance; the gizmo's ease 55 ms (2026-11-04, `1.0.95-`)

* The owner: *"why is there a 2D curve not straight when I approach the piece with A + dy in this configuration?"* — the calm's distance gate (58d86ff's:
  whole within 3.6 m of the gizmo, none from 5.4 m): an approach from 6.9 to 3.8 m faded the calm in, turning the piece's direction toward the face's normal
  as it came — a curve. *"modify the scope Q3: same calm at every distance"* → the weight is the pole's alone (`poleWeight`); `calmWeight`, `calmEngageM`,
  `CALM_RELEASE_FACTOR` and the slider `faceSpanEngageM` deleted. ⚠ Far out (6 m) the calm now applies too: the view near square in a face's middle there.
* *"set the default gizmo ease at 55 ms"* → `gizmoEaseMs` **55** (was 90); then *"update the lag the gizmo's position the piece follows to 62 ms"* → 62; then *"…to 45ms"* → **45** (2026-11-04).
* ⏳ Open, the diagnosis given to the owner (not built): every glitch reported (the red not a plane / not vertical / cut, the gizmo stuck then jumping, the
  red gone after an edge, the bounce) comes from the CONVEX HULL deciding about faces — the carrier's facet (bridging grooves, gaps, protrusions, cutting
  slanted blocks) sets the red plane's heading, the drop's direction and the calm's face, while the gizmo lands on the REAL face; a disagreement is a drop
  "turned away — held" while the carrier goes on (stuck, then a jump: 110 frames in one probe on the slanted block). Proposed Step 4c: every face-dependent
  decision from the real face the gizmo landed on; no hold while the carrier goes on. ⏳ The owner's *"Instead of a ms ease, can you reject jumps of gizmo?"*

## 14. Step 4c — the side decides; the parts read at rest — built (2026-11-04, branch `1.0.95-`)

**Why.** The owner, after a run of device reports (the red section not a plane, not vertical, cut; the gizmo *"stuck for a while … until it unlatches and
jump to the accumulated delta position"*; the red gone after an edge; the bounce): *"try to find common root causes for all these glitches instead of
patching one by one. There must be something wrong in the logic."* — then *"go ahead as step 4c. clean the previous patches accordingly"*.

**The common root cause: the CONVEX HULL decided about faces.** The carrier rides the hull of the sections (the green loop, the red chain) — and the hull
bridges the grooves between pieces, the gaps, the protruding parts, and cuts across slanted blocks. Every face-dependent decision was read off the hull
FACET under the carrier: its own slice of the turn (Step 4b), the red plane's heading (its normal snapped, Step 4), the drop's direction (its raw normal —
not snapped), the calm's face. Where a facet is not the real face, the gizmo landed OFF its red plane (the red line through it kinked — up to 74 mm,
probed), into a groove's wall or a face turned away — refused and HELD while the carrier went on: stuck, then a jump (163 frames in one random run, 110 on
the slanted block). Probed per frame (`scratchpad/holds.js`, `rootcause.js`): the holds, and the gizmo off its own red plane.

**As built** (`input/section_hull.ts`, `render/assembly_wiring.ts`):

* ⭐⭐⭐ **THE SIDE DECIDES** (`loopSides`, `sideAt`): the green loop's facets grouped by their world axis (the front, the right, the back, the left — a
  groove's bridge, a slanted block, a sliver belong to their side). Each SIDE a slice of the turn (`loopAtYaw` / `yawAtLoop` on sides — ⛔ Step 4b's per
  facet: a 45 mm bridge had its own 10.6° slice); its axis is the red plane's heading AND the drop's direction (`greenDrop` along it — ⛔ the facet's raw
  normal) and the calm's normal (from the carrier's heading — ⛔ the hit's normal). The drop along the side's axis lands exactly where the green plane and
  the red plane meet, on a face facing the ray (a groove's bottom, never its wall).
* ⭐⭐⭐ **NEVER HELD ON A SIDE**: the drop is taken whatever it hits; a miss (a gap through the assembly) puts the gizmo on the carrier itself (the hull spans
  it) — the gizmo never stops while the carrier moves. `faceTurnedAway` DELETED; the re-take of the red plane through the landing point DELETED (the drop
  lands in it). ⚠ Over a top / under a bottom the polar turn (until Step 5) still holds on a miss or a face turned away (taken there: 26 reversals and 6
  piece jumps on the top's dx legs, probed).
* ⭐⭐ **The drawn sections**: each green sample dropped along ITS side's axis; a sample's miss stands on the hull (⛔ `null`: the line cut there).
* ⭐⭐⭐ **THE PARTS READ AT REST** (the owner: *"make sure the orbit slide (the pieces translate the way the green box orbits) does not pollute the gizmo"*):
  `ffcb744` (2026-11-01) brought a hit on a swaying mesh back onto its model pose (`modelHit`) — but the RAY was cast in the world against the meshes as
  drawn: a part swayed across it was met, or missed, where it was drawn (5 mm off the ray, out of the red plane; near an edge, missed). Now every ray —
  the drop (`castRay`), the gizmo's first place (`castGizmo`), every section sample — is **cast in the model's space** (`modelCast`): against each placed
  part, the ray moved onto it as drawn (`swayRay`, `input/assembly_orbit.ts` — `unswayHit`'s inverse: the sway's translation and turn), the nearest hit
  kept and brought back (`modelHit`). The hulls, the loops, the chains and the shell's box already read the model (`placedParts`, 2026-11-01). No
  `pickWithRay` is left in the orbit's wiring.
* Cleaned: Step 4b's facet slices → sides; `facetRunToward` on sides; `asmShown.n` (the hit's normal for the calm) deleted. Kept: `loopStep`, `greenPace`,
  `greenFaces` (the owner's fallback, §13).

**Vectors**: `tests/section_hull.test.ts` + 2 (the sides of a bridged front; the drop along the side's axis in both planes, onto a groove's bottom — RED
against `370f547`: 8 with the calm's), `tests/sway_cast.test.ts` 3 (a part swayed 5 mm across the drop: on the ray at rest — ⛔ the old cast 5 mm off,
near the edge missed; the turn's round trip; no pick on the swaying meshes — RED: `swayRay` absent). **1632.**

**The probes** — the deployed `370f547` (B) against Step 4c (E), the same input:

| | B | Step 4c |
|---|---|---|
| holds (the carrier moving, the gizmo not): sides / standard close in / far / seed 7 / seed 11 / seed 13 | 69 / 25 / 25 / 163 / 18 / 11 | **11 / 6 / 7 / 56 / 1 / 0** (what is left: over the top — Step 5) |
| the gizmo off its own red plane (> 5 mm; max) | 4–16 frames a run (max 74 mm) | **0 in every run** |
| sides: off-section | 359 | 275 |
| standard legs: reversals / against the finger | 2 / 37–38 | 15–16 / 21–42 — ⚠ all on the TOP's dx (the polar turn: which drops land on the 33 mm top changed with the parts at rest; Step 5) |
| dx at mid-height, the blue at 4 m | clean | clean |

⚠ Seed 11 (8 presses): "the piece behind its face" 0 → 261 — every frame at v = 0 (the piece straight below): the piece's direction square to every
vertical face, the sign float noise (the analyser's border; the same at the bottom pole before).

## 15. Step 4c-bis — THE FACE MAP: the gizmo a function of the orbit's angles — built (2026-11-04, branch `1.0.96-Step4c-bis-of-polar-orbit`)

**Why.** The owner: *"I am really struggling with the gizmo travel. propose another way to construct the gizmo so it truly reflects the dy and dx inputs: I am
thinking at raycast from camera view towards assembly center to position the gizmo, the orbit is defined by dy and dx inputs modulated by the calm and the
tilt, the red and green sections are computed after the gizmo is updated based on the geometry of the faces contour. Advise if this would be a simpler
approach."* The answer given: yes — the carrier (Steps 2–4c) is STATE that drifts, waits, is held and jumps whenever the hull and the real face disagree;
a gizmo computed from the angles has none. But not from the CAMERA toward the CENTRE (the 2026-10-28 build): rays to one point sweep a cone (the green not a
plane), an oblique ray skips the shadow behind a protrusion (a sideways jump), and the camera carries the calm, the offsets and the lag (a feedback loop).
Instead: the place on the box, the ray along the box face's axis. Then *"can we use the contours used for the slide (the ones which highlight during a
slide) to avoid the holes or gaps ?"* — yes, as the surface the ray lands on. The owner's decisions: *"let the gizmo move slowly over the last and first few
mm of the two faces during the arc"*, *"close the holes for the moment"*, then *"Do the write-up for what we have scoped above as a new Step 4c-bis and
build, update the md files, deploy, test with random long dy and dx travels at different elevations, pitch, yaw and green piece distance."*

**As built** (`input/face_map.ts`, engine-free; wired in `render/assembly_wiring.ts` — `faceMapOf`, `rawGizmo`, `mapGizmo`, `sectionLinesFrame`):

1. ⭐⭐⭐ **THE STACKS** (`buildFaceMap`): the placed parts' faces (their model pose — the slide's own `faceWorld` / `faceTrianglesWorld`) sorted by the
   world axis they face (±x, ±y, ±z, within 20° — the slanted block faces −z), each axis's faces grouped by plane (0.5 mm) and by contact (each face's
   rectangle on the plane's axes grown 1.6 mm: the slide's `coplanarBoundary` regions — the 3 mm joints close), and **every hole inside a group CLOSED**
   (`filledRegion`: a flood fill from outside; an empty slot is filled, a notch open to the outside is not). Per placed set.
2. ⭐⭐⭐ **THE PLACE ON THE CORE BOX** (`mapTarget`): the orbit's angles read on the CORE box (`coreBox`: each side at its stack's MAIN face — the largest
   closed region; ⛔ the parts' whole box: a part sticking out of the front widened it, and at the corner the side's ray passed in front of the painting and
   met that part's side 25 cm in — probed): each side a slice of the turn (its normal ± 45° of yaw — as Step 4b / 4c's sides), the sides' band ± 45° of
   pitch over the box's height, the top's and the bottom's quarters beyond — concentric squares to the top / bottom centre at ±90°. On a side a dx keeps
   the height (the GREEN a horizontal plane) and a dy the place across (the RED the world's vertical plane square to the side) — **by construction**.
3. ⭐⭐⭐ **THE GIZMO** (`stackDepthAt`, `rawGizmo`): on the stack the place faces, the FRONTMOST group whose closed region holds it (a protrusion's face over
   the face behind it); none, the NEAREST group's plane (beside the real face, in its plane). Inside a region the ray along the axis from outside the box
   (`modelCast` — the parts at rest) for the exact surface, taken within 25 mm of the region's plane. The place's two other coordinates are kept exactly.
4. ⭐⭐⭐ **THROUGH AN EDGE, SLOWLY** (the owner's decision; `edgeMap`, `topIn`, sliders `faceEdgeSlideMm` 10 and `faceEdgeSlideDeg` 10 in CAMERA ORBIT AROUND
   CENTER): in the last 10° of a slice the place crosses the face's last 10 mm, in the next slice's first 10° the next face's first 10 mm (a thin face keeps a
   third in its middle) — the gizmo always moves, slowly, through a corner; never a wait.
5. ⭐⭐⭐ **NO JUMP AT AN EDGE** (`edgeBlend`, `mapGizmo`): the real outline at a height is not the core box's (a column standing out 45 mm, a top 41 mm above
   the core's — probed), so the face's last gizmo and the next face's first can differ. In the edge band the gizmo is BLENDED toward the next face's first
   point (a smoothstep to ½ at the slice's end, where both sides meet) — across a side's end and up / down to a top / bottom: the gizmo crosses the corner
   continuously.
6. ⭐⭐ **THE SECTIONS ARE THE GIZMO'S OWN PATHS** (`sectionLinesFrame`): the green the gizmo at every yaw at the map's pitch, the red at every pitch at the
   map's yaw — the same function, so the ring is a vertex of both by construction; a step far beyond the box's own step between neighbours (a depth step)
   breaks a line.
7. ⭐⭐ **AFTER THE SLIDE** (`mapAngles`, `syncAngle`): the map's angles put where the slide left the gizmo, then closing on the orbit's by the orbit's own
   steps (× 1.5 while it runs away, × 0.5 while it comes back — never against the finger, never a jump; caught up, exactly the orbit's). Otherwise the map's
   angles ARE the orbit's.
8. The CALM (§13) reads the map's place: on a side, its axis the calm's normal, the place across the core box's span (dx's run), the height in the box (dy's).

⛔ **Deleted**: the carrier and everything it needed — `carrierFrame`, `onGreen`, `onRed`, `redAt`, `castGizmo` and its five rays (`rayOffsets`), `castRay`,
the chain and loop caches; in `input/section_hull.ts` the sections' cuts and hulls, the chain's steps and paces (Step 3's `redPace`, Step 4b's `loopAtYaw` /
`syncStep`), the sides (Step 4c's `loopSides` / `sideAt` / `facetRunToward`), the drops, the polar turn over a top (`turnAbout`), the red plane's heading
(Step 4's `redHeading`), the by-distance fallback (§13: `loopStep`, `greenPace`, `greenFaces`). They stand at `da020af` — **the fallback is Step 4c, that
commit**. Kept in `section_hull.ts`: the lines' samples (`sectionFixed`, `insertIndex`, `gizmoJoins`). Kept: the shell (Step 2), the calm (§13), the
parts read at rest (`modelCast`, `swayRay`, Step 4c).

**What it does NOT do (stated, not discovered)**:
* **A silhouette that steps with the height** (a column lower than its neighbour): the ray along the axis meets what is really there — above the lower
  column, the taller one's side, deeper in. The gizmo steps in DEPTH there (the shell keeps the piece and the camera — Step 2). Where the outline at a
  height is narrower than the core box, the gizmo stands in the face's plane beside the real face (no part there).
* **Over a top / under a bottom** the quarters converge to the centre: the red is a vertical plane through the centre, square to a world axis only through the
  middle; a dx at ±90° does not move the gizmo (the centre). Both are Step 5's (x / z on a top). Under a bottom the ray from below meets an overhang's
  underside where nothing else is.
* **Holes closed** within a coplanar group: over an empty slot the gizmo rides the closed region at the face's depth — the approach toward it stops at the
  slot's mouth plane, not its bottom. ⏳ To confirm with the owner: the approach reading the real depth under the gizmo in a slot (proposed 2026-11-04).
* Frame cost: a section line recomputed (each frame of a dx for the red, of a dy for the green) casts 64 / 96 samples, up to four rays each in the edge
  bands — not measured on the iPhone.

**Vectors**: `tests/face_map.test.ts` 10 (the holes closed; the stacks — joints, frontmost, nearest, the slanted face; the core box and its corner; the
planes on a side; no jump anywhere on the box, the poles; the slow stretch through an edge; the blend at a slice's end; the angles back; out of step; the
wiring) — RED against `da020af` (the module absent). The carrier's vectors deleted with it (`section_hull.test.ts` 29 → 2; `orbit_calm.test.ts`'s two
facet-run vectors replaced by one on the map's side; `assembly_orbit.test.ts`'s `rayOffsets`). **1613** (1632 − 29 carrier vectors and the like + 10).

**The probes** — Step 4c (`da020af`, B) against Step 4c-bis (E), the same input, `scripts/probes/` (⭐ `LEGMAXY` added: a dy leg of 1400 px only parks the
pitch at ±90°, ~0.67° a px): random legs after three random lead-ins (dx up to 1400 px — two to three turns —, dy / diagonal up to 250 px), seeds 3, 7,
11, 13, the piece far out (APPR 0), mid (80) and close in (140); and constant legs (L 1400, D 120, R 1400, U 240, L 1400) after two random lead-ins
(seeds 5, 9), far and close in.

| summed over the runs | Step 4c (B) | Step 4c-bis |
|---|---|---|
| random — 12 runs (4 seeds × far / mid / close): the piece behind its gizmo's face | 4214 frames | **0** |
| …against the finger (of the frames the gizmo moves) | 991 of 16974 (5.8 %) | **33 of 11809 (0.3 %)** |
| …the camera rolled on a wall | 4172 | **24** |
| …jumps: piece / camera / gizmo | 30 / 19 / 160 | 3 / 30 / 133 |
| constant legs — 4 runs (L 1400, D 120, R 1400, U 240, L 1400 after lead-ins; far / close): off-section | 8548 | 2884 — **on a side 44, all an analyser artefact** (the leg's plane taken under the bottom; on the side the gizmo kept its red plane, x 0.202 m); the rest under the bottom (2768) and on the top (28) |
| …reverse / stuck | 120 / 76 | 58 / 14 — reverse **on a side 2**, the rest under the bottom; stuck only at the ±90° clamps and under the bottom |
| …against the finger | 893 of 4380 | **6 of 2536** |
| …the piece behind / rolled on a wall | 202 / 17 | **0** / 4 |
| …jumps: piece / camera / gizmo | 31 / 5 / 122 | **0** / 1 / 46 |

⭐ Read: on the sides the face map holds I1–I5 (its residual flags are the analyser's: a leg's plane read under the bottom; a camera "jump" is the frame
an input lands after two or three without one — the probe's cadence under load, the step itself regular, B has the same). The gizmo's own jumps are DEPTH
steps (42 mm between two tops of different heights under a dx near the top; a part's side standing out) — the shell keeps the piece and the camera.
⚠ What is left is UNDER THE BOTTOM (and over the top, less): the quarters are concentric squares, not planes, and a ray from below meets overhangs'
undersides — Step 5's. ⚠ The matrix's moving frames are fewer for Step 4c-bis (11809 against 16974) for the same input: B's carrier moves (a polar
turn, holds released) where the map's place does not — at ±90° the centre.

⛔ No device close.

## 16. Before Step 5 — the amendments and decisions Step 4c-bis made necessary (2026-11-04)

> The owner: *"do I need to modify the specifications for the next steps, given the change we have implemented on step4c-bis ?"* → *"capture all that in
> the md file as amendments required to be done or decided before proceeding to next steps"* → *"explain me why we cannot tilt the orbit when the dy
> reaches certain thresholds … Wasn't it the purpose of step 5 ? Isn't it possible after step 4c-bis ?"* → *"let's go one step further: … the pitch rotating
> shall be done by the value of the angle between the normals of the current faces contour and the next faces contour projected in the plane orthogonal to
> the edge between those contours. This way, if the assembly is multi-faceted, the orbit is always in front of the face it orbits around."* → *"update the md
> files by rewriting the next steps in line with this new design."*

**Why.** Steps 5–8 were written for the CARRIER (§3), a stateful point on the sections' hulls. Step 4c-bis deleted it: the gizmo is a FUNCTION of the
orbit's angles (§15). One angle frame for the whole assembly has a pole (a top's centre), so the crossings could not be built on it as it stood — but ONE
frame was the limit, not the angles: frames switched at the edges cover the assembly without ever reaching a pole (an atlas, as no single chart covers a
sphere). ⚠ The first answer here (D1 below as first written: *the walk, or stay on the angles*) overstated that the walk was needed.

### 16.1 The decisions

* ✅ **D1 — DECIDED (2026-11-04): THE FACET FRAMES.** The owner's design (quoted above): at every crossing the orbit's frame turns about the edge by the
  dihedral between the faces — 90° on a box, the facet's own angle on a multi-faceted assembly. It supersedes both first options (a smooth walk on the
  shell; staying on one angle frame) — it IS the walk, discrete on the facets, and keeps the orbit's angles (the camera, the spring, the solver's queries
  and the slide's re-base all read angles today). → §4.4, §5 Steps 5–8 rewritten.
> *"step 5: ok. Step 6: the bottom is a face to orbit as the others (remember that the floor can be crossed by the camera and is invisible from below)
> Approach into an empty slot: the gizmo shall read the real depth under the gizmo, but the piece shall not go in (it shall continue its orbit). However,
> the A + dy shall be able to bring the piece inside the depth up to where it collides or where it meets the center of the orbit. Edge stretch defaults:
> OK."* — the owner, 2026-11-04.

* ✅ **D5 — DECIDED (2026-11-04, *"step 5: ok"*): the facets as proposed.** Merged within 20° (today's `MAP_AXIS_DEG`), kept only above a minimum share
  of real face area behind them — so a slanted block, a chamfer or a hull bridge never tilts the orbit; on a box the six faces exactly. Both sliders;
  ⚠ the area share had no number in the proposal — Step 5 sets its default so that `Scene_1` keeps exactly its six faces (the gate), and reports it.
* ✅ **I1's restated wording — ACCEPTED with Step 5 (*"step 5: ok"*)**: the sections are the FACET FRAME's planes (§2); the world's horizontal / vertical on a
  box.
* ✅ **D2 — DECIDED (2026-11-04): THE BOTTOM IS A FACE TO ORBIT AS THE OTHERS** — *"remember that the floor can be crossed by the camera and is invisible from
  below"* (the frozen floor seen from below is not drawn, `D128`; its top contour shown instead, `D196`). → Step 6: the bottom reached and orbited exactly
  as the top. ⚠ To check there, not assume: the piece under the assembly goes below the floor's top — the play volume (`D181`, the pieces kept on the
  floor) and the solver's contacts must not stop the ORBITED piece's orbit there (the floor is no host, `HOVER.md` §11), and the camera under the floor
  sees the assembly from below through it.
* ✅ **D3 — DECIDED (2026-11-04): THE GIZMO READS THE REAL DEPTH; THE PIECE ORBITS ON; A + dy GOES IN.** Over an empty slot (a hole closed in its region,
  §15) the GIZMO is at the real surface under it — the slot's bottom (⛔ the face's depth across the mouth, Step 4c-bis); the ORBIT does not follow it in:
  the piece and the camera go on on the shell (Step 2 — a depth step moves the gizmo, never them). The APPROACH (A + dy, two fingers) brings the piece
  INTO the depth, toward that gizmo, until it collides (the solver, as today) or meets the orbit's centre. → built with Step 5 (the face map on facets).
  ✅ *"the center of the orbit"* is the GIZMO (the orbit's centre the piece turns about — `orbitCentreM`) — the owner, 2026-11-04: *"center of the orbit =
  gizmo."* The closed regions still choose the FRONTMOST face and keep the gizmo continuous across a slot's rim (no lateral jump); only
  the depth is the real one (the ray along the normal, no longer refused beyond 25 mm of the region's plane); a slot through the whole assembly (no
  surface behind): the region's plane, as today.
* ✅ **D4 — DECIDED (2026-11-04, *"Edge stretch defaults: OK"*):** `faceEdgeSlideMm` 10, `faceEdgeSlideDeg` 10 stand.
* ✅ **D6 — DECIDED (2026-11-04): THE SCENE UPSIDE UP ON EVERY NON-HORIZONTAL FACE** — *"the camera roll shall keep the scene upside up if the face is not purely horizontal (for example, a series of walks around the edges of the rectangle faces of an horizontally extruded hexagon could end up with the scene upside down and when the orbit would tilt to be in front of the hexagonal face it should be gravity axis aligned with screen vertical axis)"* → §4.5, §5 Step 7 (its roll rule and its gate).

### 16.2 The amendments — applied 2026-11-04

* ✅ **A1** — I4 reworded (§2): the finger drives the orbit; the gizmo, the piece and the camera follow from it.
* ✅ **A1′** — I1 restated in the facet frame (§2) — accepted with Step 5 (16.1).
* ✅ **A2** — §3 marked as the history; the code to build on is §15.
* ✅ **A3 / A4** — §5 Steps 5–7 rewritten: the faces contour and the face map on facets (Step 5), the frame turn at a crossing up onto a top / down onto a
  bottom (Step 6), crossing on with every edge the same rule — the half and quarter rolls of §4 its camera's side (Step 7); §4.4 states the rule.
* ✅ **A5** — §5 Step 8 rewritten: what the faces contour misses, and the shell on the facets.
* ✅ **A6** — §5 Step 9 noted: built; its targets the face map's, the facet's from Step 5.
* ✅ **A7** — §6: *derive the gizmo, do not carry it*, and its limit (the pole → the facet frames).

### 16.3 Carried, not blocking

* No device close on Steps 0–4c-bis (rule 5). The owner tests `b373acb` (deployed 2026-11-04) — its findings may add to D4 or A5.
* The frame cost of the drawn sections (64 / 96 samples, up to four rays each in the edge bands) is not measured on the iPhone (§15).

## 17. Step 5 — THE FACES CONTOUR: the face map on facets — built (2026-11-05, branch `1.0.99-Polar-orbit-finalized`, renamed from `1.0.99-`)

**As built** (`input/face_map.ts`, engine-free; wired in `render/assembly_wiring.ts` — `faceMapOf`, `rawGizmo`, `mapGizmo`):

1. ⭐⭐⭐ **THE FACETS** (`buildFaceMap`): the placed parts' faces clustered by normal — the largest face first, every face within `facetMergeDeg` (20°) of
   a seed joins it (a normal within 1e-9 of a world axis snapped onto it). Each cluster a CANDIDATE: its stack (`stackOf` — Step 4c-bis's per axis, now per
   normal: by plane, by contact, holes closed), its plane the MAIN group's (the largest closed region — the core box's rule, generalised). Its POLYGON on
   the contour: the half-spaces' intersection, bounded by the parts' box (`facetPolygon`, Sutherland–Hodgman). ⭐ **D5, GREEDY**: the candidates taken by
   their real face, largest first; one is kept when its real face covers `facetMinShare` (¼) of its polygon AND every one kept still does. ⛔ Built first
   as *all at once, then the worst dropped*: on `Scene_1` a frustum's slanted plane cut the painting's front away whole (its share 0 — dropped first), the
   contour three slanted planes — probed by the grid. ⭐ `Scene_1`: **exactly its six faces** (shares 1 / 1 / 1 / 1 / 0.78 / 0.77; the frusta's slanted
   sides refused).
2. ⭐⭐ **THE UPRIGHT FRAME, generalised** (no frame turn — Step 6's): the CAPS, the facet nearest straight up / down beyond 45° (else a virtual one at the
   box); the COLUMNS, the other facets by heading (within `facetMergeDeg`), each a slice of the yaw from halfway to each neighbour's heading; in a column
   the facets stacked by elevation, each a band of the pitch from halfway to each neighbour's (±90° for the caps). On a box: 4 × 90°, ±45° — Step 4c-bis.
3. ⭐⭐⭐ **THE PLACE IN THE FACET'S FRAME** (`mapTarget`, `facetFrame`): `t` the way the yaw turns across it (level), `b = t × n` up its slope — across it
   by the yaw, up it by the pitch (`edgeMap` each, the slow stretch kept). **I1 in the facet frame by construction**: a dx moves the place along `t` only
   (the green: the plane of `t` and `n`), a dy along `b` only (the red: the plane of `b` and `n`). Over a cap, the column's top / bottom facet's edge drawn in
   toward the cap's centre — ⭐ the rim across the CAP'S EDGE toward the facet (`capSpan`; ⛔ the facet's own width: a hexagon's end is ±R wide at
   mid-height, its bottom edge ±R/2 — the quarter ran over its neighbour's, probed by the round trip; ⛔ the whole cap's extent: on a vertical hexagon twice
   the facet's edge).
4. ⭐⭐ **THE BLEND THROUGH AN EDGE MOVED INTO `src/input`** (`blendThroughEdges`; the 2026-09-19 lesson: a rule in a render file is a rule nothing can
   interrogate) — vectored on a non-box contour: ⭐ the slice-end blend at EVERY pitch where the next column's caps start at another pitch (a hexagon's end
   column tops out at 45°, its slanted one at 60° — their quarters' places parted at the slice's end); ⭐ a column's bottom bound read on the facet's side,
   as `mapTarget` puts it (⛔ read as the cap's: 41 mm on the hexagon's end). On a box both rules are Step 4c-bis's.
5. ⭐⭐⭐ **D3 — THE GIZMO AT THE REAL DEPTH** (`rawGizmo`): the ray along the facet's normal from outside the box taken WHATEVER its depth — over an empty slot
   its bottom, over an overhang its real surface; the closed region still chooses the face (no lateral jump at a rim); no hit (a slot through the whole
   assembly): the region's plane. ⛔ `MAP_REFINE_M` (25 mm) deleted. The piece and the camera ride the shell (Step 2).
6. The calm's normal the facet's, read level (`calmFrame`); after the slide, `mapAngles` on facets and `facetOfNormal` (the facet nearest the slide's face).
7. The knobs (D5): `facetMergeDeg` 20, `facetMinShare` 0.25 — CAMERA ORBIT AROUND CENTER sliders, in the map's cache key.

**Vectors**: `tests/facets.test.ts` 6 (D5 on a box with an overhang's slanted plane crossing it — six facets at ¼, seven at a tenth, six merged within 35°;
a VERTICAL hexagonal prism — six columns of 60°, the facet always facing the yaw, I1, no jump; a HORIZONTAL hexagonal prism — four columns, two facets
stacked at ±30°, the bands [−60°, 0, 60°], I1 on a slanted facet; no jump through every edge and the caps' quarters; the round trip on facets; the wiring
and the sliders) — RED against `81e5ba2` (the facets absent); five mutants (the slice-end blend at Step 4c-bis's pitches only, the cap's rim over the
facet's width, the bottom bound read as the cap's, the whole cap's extent, no share asked) each turn one RED. `face_map.test.ts` and `orbit_calm.test.ts`
ported to the facets (the box map: `buildFaceMap([], box)`) — all their box vectors pass unchanged. **1622** (1616 + 6).

**The gate — `Scene_1` exactly as Step 4c-bis** (`scripts/probes/map_grid.mjs`: the gizmo `mapGizmo` gives over yaw × pitch every 2°, 16 380 angles, read
in the page; `COMPARE=a,b`): against `81e5ba2`, **15 745 identical** (< 0.1 mm); the 635 others are D3's — 625 purely along the facet's normal, the 10 left
in edge-blend bands (a neighbour's depth blended in): over the TOP 117 deeper by 32–41 mm (beside Piece44 onto Piece4's top; into the orbited piece's goal
slot), under the BOTTOM 57 deeper (58 mm, a slot) and 336 outward (17–61 mm, the overhang Piece43's underside), on the +x side 110 outward (12–29 mm,
Piece42), the front 5 deeper (41 mm).

**The probes** (`orbit_probe.mjs` / `analyse_orbit.mjs`, §15's matrix — random legs after three lead-ins, seeds 3 / 7 / 11 / 13 × far / mid / close;
constant legs L 1400, D 120, R 1400, U 240, L 1400 after two lead-ins, seeds 5 / 9 × far / close):

| summed over the runs | Step 4c-bis (§15) | Step 5 |
|---|---|---|
| random — the piece behind its gizmo's face | 0 | **0** |
| …against the finger | 33 of 11 809 (0.3 %) | **11 of 6 630 (0.17 %)** |
| …the camera rolled on a wall | 24 | 32 (6–7°, a few frames each) |
| …jumps: piece / camera / gizmo | 3 / 30 / 133 | **0 / 4 / 55** |
| constant — off-section | 2 884 | 2 542 (under the bottom and over the top, as before) |
| …reverse / stuck | 58 / 14 | 9 / 34 — **every stuck frame at the ±90° clamps (the polar centre) or under the bottom near −80°** (Step 6) |
| …against the finger / the piece behind / rolled | 6 of 2 536 / 0 / 4 | **2 of 2 342 / 0 / 0** |
| …jumps: piece / camera / gizmo | 0 / 1 / 46 | **0 / 0 / 8** |

⚠ The moving frames are fewer for the same input (the machine's cadence under load — Step 4c-bis's numbers are §15's, not re-run). 0 page errors.

**D3's approach** (a scratch probe: the orbit set over the goal slot, yaw 114° / 130°, pitch 72° / 78° — the gizmo at the slot's bottom, y 0.4665 against the
top's 0.4985; then A + drag up): the piece comes straight in and STOPS at Piece44 — the overhang frustum 6.75 mm beside the slot — the slide latching on its
face at 1 mm (the piece's lowest point 0.5408). ⚠ So on `Scene_1` the piece entering a slot is NOT shown: its footprint meets Piece44 first (*"until it
collides"*). A slot with nothing beside it is owed a look.

**What it does NOT do** (stated, not discovered): the frame does not turn (Step 6 — the caps' quarters still converge to their centres, the dx at ±90°
moves nothing); the shell is still the parts' BOX (Step 8 — round a hexagon the piece would ride a box's corner); a ray from below meets an overhang's
underside (Piece43 — now taken, D3; Step 8 decides); `buildFaceMap` runs once per placed set (greedy, O(n²) polygon clips — unmeasured on the iPhone).

⛔ No device close.

## 18. The voids, the edges, the piece's support — built (2026-11-05, branch `1.0.100-`)

**The owner's asks** (2026-11-05): *"gizmo over a void: the gizmo stays on the red and green contour intersection … No dashed lines"*; *"when I move with
a mix of dx and dy the gizmo goes to the black face then jumps back and forth … find the true original logic flaw"*; then, on the void: *"it depends if the
void is open or closed on the section travel: in attachment 1 the void is open on the red section travel so the orbit tilt shall take over once it is
built, in attachment 2 the void is closed on the green section travel so the green section and the gizmo shall go through"*; and *"run a series of dx and
dy and mixed dx-dy across the assembly … check jumps + back-and-forth + blockages … analyze the root causes before proposing fixes"*.

**Built — four root causes, one fix each** (no patch: each at the one point every caller shares):

1. ⭐⭐⭐ **THE BACK-AND-FORTH** (`placeAtAngles`, `gizmoAtAngles`; `tests/place_at_angles.test.ts`): since Step 4c-bis the gizmo is a function of the
   angles, but every angle the SOLVER tried was placed round the gizmo of the FRAME's angles (the last frame's result) — its world moved with its own
   result. A step met a part and slid the piece down; the gizmo was re-read lower; the way back to the height kept was tried round that lower gizmo — a
   place lower than the real one, free — and taken: down and up every two frames (probed, seed 7 `DIAG`: v 0.6865 ↔ 0.6808 at the pointer's cadence). Now
   an angle's place is a function of the angle alone. Probes: 27 back-and-forth → 0.
2. ⭐⭐⭐ **THE VOID CLOSED ON A TRAVEL** (`stackDepthAt`'s `bridged`, `closedAlong`, `regionReal`; `tests/void_bridge.test.ts`) — **D3 AMENDED**: on the
   facet's plane (its main group's), no face of that plane under the point but its faces on both sides along `t` (the green's travel on a side) or `b`
   (the red's): the gizmo and both lines go STRAIGHT THROUGH on the plane, never cast to the void's bottom; a cast still takes what stands IN FRONT of the
   plane (a part rising out of the void). A void open on both travels keeps its depth until the frame turn (Steps 6–7) — the owner's attachment 1.
   `Scene_1`'s gizmo grid (`map_grid.mjs`): 1401 of 16 380 angles change — 1174 over the top and 79 under the bottom out to the face's plane (16–58 mm), the
   148 others side angles in the edge-blend bands following the caps; nothing deeper, no protrusion flattened. ⚠ Cost: A + dy no longer goes into a slot
   bridged over (D3's *"A + dy going in to the contact"* — on `Scene_1` it never did: Piece44 stops the piece first, §17).
3. ⭐⭐⭐ **A BLENDED PLACE IS A PLACE; ITS DEPTH IS CAST** (`blendThroughEdges`' `cast`, `blendCast`; `tests/edge_surface.test.ts`): through an edge the
   gizmo was the CHORD between two real-surface points; where the real outline stands out past the contour's edge (Piece3, 45 mm proud of the −x side) the
   chord ran through the part — the gizmo 2.8 mm inside it, the close-in dx stalled 630 frames at the front-left corner. Now the ray along the blended
   normal from half the chord + 5 mm in front: a surface in front of the chord takes the gizmo, never deeper (a concave chord stays in the air, a void
   stays bridged); both sides of an edge blend to the same place and normal.
4. ⭐⭐⭐ **THE PIECE'S SUPPORT AT THE GIZMO, NOT ITS RESTING FACE'S CENTRE** (`faceLift`, `placeAtAngles`' lift; the solver's place, the drawn one, the
   foot): the piece is placed by its resting face's centre (`placeByFaceCentre`) — its BOTTOM — and the approach's end put that centre on the gizmo
   whatever the direction: in front of a wall half its body behind the wall's plane (only the collision kept it out), round an edge into the next face.
   Now the piece's nearest point along the direction is the approach's distance from the gizmo: 0 square to the face, its overhang as the direction tilts,
   smooth. After 3 and 4 the close-in dx goes round the whole assembly four times (it stopped at the first corner).

**The probes** (`orbit_probe.mjs` + `analyse_orbit.mjs`, which now also counts **I7: back-and-forth** — a step > 8 mm back within 6 frames — and **blockages
on every leg** — the finger moving, the gizmo and the piece still 15 frames, the ±89.5° pole excepted; `DIAG=1` legs mix dx and dy at random angles;
`AFTER=` evaluates a page expression after the legs). Thirteen runs: constant legs round and over the assembly far / mid / close, at three heights, over
the poles; random mixed legs, seeds 3 / 7 / 11 / 13 / 17; random pure legs, seeds 5 / 9. `f1618e7` (the back-and-forth fixed) against `0736134`:

| summed over the 13 runs | before | after |
|---|---|---|
| blockages (15+ frames) | 51 | **36** |
| against the finger | 73 of 3 218 (2.3 %) | **51 of 4 259 (1.2 %)** |
| reversals on one face | 74 | **14** |
| jumps: piece / camera | 4 / 10 | **4 / 4** |
| the camera rolled on a wall | 221 | **126** |
| the piece behind its gizmo's face | 0 | **0** |
| back-and-forth | 6 | 11 — all the camera's, over the top at ~70° (below) |

**Found, NOT built — the owner decides** (each a root cause, each named where it lives). ⭐ (the owner, 2026-11-05: *"capture that in the md files; if
the issues will be addressed by the next steps' builds, capture to check that during the next steps' builds"*) — each one's step is named and the
CHECK is written into that step's gate (§5): ⭐ **§18-C1** Step 8, **§18-C2** and **§18-C3** Step 6, **§18-C4** Step 7, **§18-C5** the hover, **§18-C6** every
step (the matrix re-run against §18's table):

* ⛔ **CLOSE IN, THE PIECE IS PLACED FROM ONE SURFACE POINT** — within the shell's offset (60 mm) the foot comes down onto the gizmo, so (a) where a part
  stands out the gizmo's depth STEPS (95 mm at Piece9's edge on the −x side) and the piece's place jumps (61 mm in 0.001 of `v`): the solver, built on
  a continuous ring, shrinks every stride below the jump — the piece FROZEN, nothing touched, while the finger's orbit runs on (three turns, probed:
  17 of the 36 blockages); (b) a part rising BESIDE the gizmo (Piece44, 41 mm above the top) meets the piece's 10 cm body before the gizmo reaches it —
  blocked, touching (13 of the 36). ⭐ Proposed: the piece's place read from what its FOOTPRINT meets — along the ray, the outermost point where the
  piece clears the parts' boxes by the approach's distance (the boxes inflated by the piece's own, sphere-traced: no collision query, continuous) — the
  shell of Step 8 built from the parts instead of their box. → **§18-C1, Step 8's gate.**
* ⛔ **THE POLE** — over the top at ~70°, close in, against Piece44 with a dy: the slide's yaw swings ±7.5° every input frame (the piece 2.5 mm, the camera
  33 mm): near the pole the yaw is a cheap coordinate and the contact's side flips — Step 6's frame turn. → **§18-C2, Step 6's gate.** The camera's roll
  under the bottom (−64° … −73°: 119 frames over 5° in the matrix) and the dx at ±90° (nothing moves at the top centre) → **§18-C3, Step 6's gate**
  (Step 7's for the roll on a slanted facet).
* ⛔ **A VOID OPEN ON A TRAVEL** (the owner's attachment 1 — the red runs straight up through a notch open on its travel, in the air, then meets the next
  face): the gizmo stays a function of the angles, so it cannot turn at the notch's real edge — *"the orbit tilt shall take over once it is built"*.
  → **§18-C4, Step 7's gate** (every crossing the same rule — a crossing at a REAL edge, not only at the contour's).
* ⛔ **THE SLIDE IN A SLOT** — latched in the top's slot (before the void rule led the piece there), every drag was refused (*"at the edge of the hosting
  faces"*) — the hover (`HOVER.md` §0) waits; the void rule removes the way in. → **§18-C5, `HOVER.md` §0 item 22** (not a step of this rebuild).
* ⭐ **§18-C6 — EVERY STEP**: the thirteen-run matrix (`orbit_probe.mjs` with `DIAG=1` / `AFTER=`, `analyse_orbit.mjs` with I7 — the runs' settings in
  §18's probe paragraph) re-run at each step's close, its totals against §18's *after* column: no line worse without a named cause.

**Vectors**: `place_at_angles` 3, `void_bridge` 7, `edge_surface` 4 — each RED on the code before it; `face_map`, `facets`, `orbit_shell` wiring strings
updated. **1636** (1622 + 3 + 7 + 4). ⛔ No device close.

## 19. Step 6 — the frame turn at a crossing: up onto a top, down onto a bottom — built (2026-11-05, branch `1.0.101-`)

**As built** (`input/orbit_frame.ts`, engine-free; wired in `render/assembly_wiring.ts`, the slide's re-base in `render/hover_wiring.ts`, the solved place's
bound in `render/green_box_wiring.ts`):

1. ⭐⭐⭐ **THE FRAME** (`OrbitFrame`, `st.orbitFrame`): a rotation (world from frame); upright, the world's. EVERY angle of the orbit is read in it — the
   piece's direction (`dirAt`: `toWorld(frame, orbitDir)`), the calm (`calmDir` in the frame's axes), the camera (`assemblyCameraFrame`: built in the frame,
   its up the frame's), the face map (`faceMapOf`: the placed faces and the parts' box read IN the frame, a few maps kept), the gizmo (`mapGizmoF` in the
   frame's coordinates, its casts out to the world and back — `frameCast`; `mapGizmo` turns its result out for the probes, the lines, the solver's places).
2. ⭐⭐⭐ **THE TURN** (`frameStep`, for the SOLVED place): upright, past a column's top (bottom) bound — the frame turned about the edge between the column's
   top (bottom) facet and the cap by their dihedral (`shortestArc` of their normals: 90° on a box); the cap is then the facet at the same heading in the
   new frame's map. Turned, past the cap's band on the way back by 3° (`FRAME_BACK_MARGIN_RAD`) — upright again: no dithering on the threshold.
3. ⭐⭐⭐ **NOTHING MOVES AT THE TURN** (`orbitFrameTurn`, `rebaseAngles`): the target, the solved place, the eye's spring, the camera's leash and lag, the
   solver's last raw input and its height kept, the gizmo's sync — each re-read as the SAME direction; the gizmo's map angles put on the gizmo
   (`mapAngles`, then Gauss–Newton on the two angles with backtracking — `gizmoAnglesAt`: an edge's gizmo is a blend of two facets' points, on neither
   plane); the calm carried (its normal the facet now faced, its shares the ones that show the same direction — `sharesShowing`).
4. ⭐⭐ **STEP 6's CLAMPS** (`frameClamp`): in a turned frame the far edge and the side edges hold (no second crossing — Step 7), and the way back is
   bounded just past its threshold (`FRAME_BACK_REACH_RAD`, the margin + 1°); the clamps bound the TARGET (`orbitFrameStep`) and the SOLVED place
   (`frameClampSolved` — the place held becomes the solver's target and height kept).
5. ⭐⭐ **THE ROLL OWED** (`rollOwed`, `rollStep`, `st.orbitRoll`): crossing off square, the camera's upright up differs in the two frames (40–54° on
   `Scene_1`'s diagonals); the old up is shown, the difference taken off LINEARLY by the dy's travel AWAY from the edge just crossed (`dir`), the piece
   waiting, a dx held; back past its start, the frame turns back to the one it came from. Square to the edge: none.
6. ⭐ **D2 — THE BOTTOM AS THE TOP**: reached and orbited the same way; the floor (frozen, exempt) and the play volume (not in the orbited piece's
   collision) never stop it; the camera goes under the floor's top (probed: y −1.0 … −1.3 m).
7. ⭐ **THE CALM'S VERTICAL RUN ON THE FACET'S SPAN** (`calmFrame`): ⛔ on the placed parts' BOX — `Scene_1`'s parts rise 41 mm above the top face, so at
   the front's top EDGE, where the frame turns, the calm still held the piece 8° under the orbit (share 0.82); restarted at the turn, the piece jumped
   2.8 m far out. The facet's span is whole at its edges and the same on every side of a box (the bounce stays fixed).

**Found by the probes in the first build, fixed before it landed** (root causes, not patches): the calm's run on the box (item 7 — the piece 2.8 m at a
turn); the roll's travel read in the frame's own sense and its way back always upright (a turn back down off a top: the camera rolled 53° in a frame);
the clamps on the target only (a slide along Piece44 carried the piece past a side edge, the clamp pulled it back — the camera 33 mm back and forth); the
way back unbounded (a dy back ran the target to the turned frame's own pole, the turn back re-based it onto another world direction — 834 mm of camera in a
frame); the gizmo's angles put by projection only (24 mm off — item 3); the calm's shares kept through an off-square turn (the piece 35 mm).

**The probes** (`orbit_probe.mjs` now records the frame `fr` and the roll left `rl`; eight runs: a square dy over the top, dx to both side edges, a dy
down the whole assembly to the bottom and back up — far and close; the same off square — mid and close; mixed random legs, seeds 3 / 7 / 13; pure random,
seed 5):

| | Step 6 |
|---|---|
| turns per constant run | 2–5, each with the piece, the camera and the up continuous (the square turn onto the top: piece 45 mm in a frame of 400 mm far out, the up 0.4°) |
| I1 on a cap (the gizmo's spread across a leg's other axis) | 0.0 mm (a dx on the top keeps z, a dy keeps x) |
| back-and-forth | 0–1 a run |
| the camera's up turned most in a frame | 4.8–7.6° (36° in the first build) |
| the piece behind its gizmo's face | 0 (one frame, 6.6 mm, under Piece42's slanted overhang at the front-right corner — Step 8's) |
| §18-C2 (seed 17, close in: the slide's yaw over the top against Piece44) | **back-and-forth 5 → 0, camera jumps 1 → 0** |
| §18-C3 (the roll under the bottom, a dx at ±90°) | by construction: the orbit turns at 45°, the poles never reached |

⚠ The analyser's I6 (*the camera upright on a wall*) flags frames IN a turned frame or while a roll is owed — the frame's up by design; none upright
without a roll. Its BLOCKED / STUCK flags are the clamps (the far and side edges) and the roll's wait — Step 6's stops.

**What it does NOT do / left**: no second crossing (the far edge and the side edges hold — Step 7, with the half and quarter rolls); off square, the
gizmo's map angles (on the gizmo) and the orbit's (on the piece's direction) differ by a few degrees after the turn — the sync closes them at 1.5 × the
orbit's step, so for one input frame the gizmo moves 24–46 mm instead of ~13 (continuous, fast); a roll owed waits for the dy's travel (a dx alone does
not take it — a pause). ⛔ No device close.

**Vectors**: `tests/orbit_frame.test.ts` 9 (the turn onto the top / bottom / about a side's edge; nothing moves; I1 on the top in the turned frame; the
gizmo kept by `mapAngles`; the clamps and the way back; the roll owed and its steps; the calm carried — `sharesShowing`; the wiring) — RED against
`3c00d35` (the module absent); `orbit_calm` (the facet's span), `face_map`, `facets`, `assembly_orbit`, `hover`, `sway_cast`, `piece_collision`,
`piece_orbit_solver` wiring strings updated. **1645** (1636 + 9).

## 20. The frame turn REDESIGNED — deployed (2026-11-05, branch `1.0.101-`, build `9595f4d`); the owner debugging it

**Why** (the owner on §19's Step 6, on the device: *"This implementation is full of bugs: jumps, back-and-forth, stuck, camera views upside down, slanted
camera views"*). The 13-run traversal matrix against the one before Step 6: every run that reached a top or a bottom tilted (13 / 13), 12 upside down;
blockages 36 → 118. Root causes: (1) the camera's up was the turned FRAME's for every view — gravity only along the crossing, 90° off at a top's side
edges, 135–180° past its middle; (2) Step 6's clamps at the far and side edges made dead ends, and the roll owed made the piece wait; (3) off square the
orbit's angles and the face map's disagree after a turn (the gizmo's catch-up). `main` was put back to `ef5fa8f` while the redesign was built, then
redeployed with it (`9595f4d`).

**As deployed**:
1. ⭐⭐⭐ **THE CAMERA'S UP FROM THE VIEW** (`input/camera_up.ts`): beyond 45° of the vertical GRAVITY's up (every wall, from any path); within 35° CARRIED
   (no roll at a crossing, square or not); between, the carried up rolled onto gravity — the half roll in the last 10° before a cap's far edge, the
   quarter before a side edge, none back the way it came.
2. ⭐⭐ **A CAP LEFT BY ANY EDGE** (`capExit`): every wall orbited upright; Step 6's clamps, roll owed and waits deleted.
3. ⭐ **THE HOLD** (`holdPitch`, §4.2): the drag that left a cap over its far edge held 3° under that cap's bound until the finger lifts. ⛔ **TO BE REMOVED —
   see below.**
4. Fixed on the way, at their roots: the calm's targets flipped at a band's edge (now the facet just passed — the camera swung 100–127 mm); the hold ON the
   bound (a dx then ran the top's rim, folding at its corners); the solver's way back to the height kept taken whole in one frame (`wayBackStep`: never
   faster than the finger — the camera 120 mm). `calmHeading` deleted.

Matrix (13 runs, moving frames 4 259 / 4 563 / 11 779 — the redesign travels further, no clamps): before Step 6 / Step 6 / the redesign — tilted runs
0 / 13 / **0**, upside down 0 / 12 / **0**, blockages 36 / 118 / **42**, back-and-forth 11 / 4 / **36**, against the finger 1.2 % / 1.4 % / **1.6 %**,
jumps piece 4 / 9 / **17**, camera 4 / 9 / **13**. **1650 vectors.** ⛔ No device close.

### 20.1 The owner's decisions while debugging — NOT BUILT YET (the owner: *"I will keep debugging so do not build anything yet as I do not want to add
patches over patches"*)

* ⛔ **NO HOLD** (2026-11-05, the owner — on the device a dy up a wall was refused while another dy up the same wall turned onto the top: the first drag had
  earlier left the top over its far edge, so the hold refused it): *"I do not want any hold."* → **remove the hold** (`holdPitch`, `st.orbitHold`, the
  `exit === "FAR"` latch in `orbitFrameStep`, `frameStep`'s `hold` argument, their vectors). The behaviour accepted instead: **a finger kept on loops over the
  top back and forth, the camera half-rolling at each far edge** (no direction is refused; the dy goes the finger's way on the screen, I5).
* ✅ **OFF SQUARE ONTO A TOP / A BOTTOM — (b), A ROLL AT THE CROSSING** (2026-11-05, the owner: *"(b) A roll at the crossing: align the camera with the
  top's axes as you cross"*). The problem: onto a top off square nothing rolls at the crossing (§20 item 1), so the camera keeps its entry orientation while
  dx / dy move along the top's own axes — the gizmo up to the entry angle off the finger's direction (most of the 1.6 % against the finger). The choice:
  as the piece crosses onto a top or a bottom, the camera ROLLS to align with the cap's axes (the screen's up along the cap's dy axis, its right along its
  dx axis), so I5 and I1 both hold on the cap. ⚠ To settle when it is built: the roll's pace (over the crossing's edge stretch, or over the input's travel
  with the piece waiting — Step 6's roll owed waited; the owner rejected the waits), and how it composes with §20's view rule (the carried up starts
  aligned with the cap instead of as gravity's). The other options were (a) the finger's screen direction driving the gizmo on a cap (I1 loosened there)
  and (c) as is.
* ⚠ The HUD's verdict *"held at the edge until the finger lifts or reverses"* — wrong (only lifting released it); goes with the hold.

## 21. THE SECTIONS AS PLANE CUTS — the gizmo travels on them (approved design 2026-11-05; ⛔ NOT BUILT — awaiting the owner's go)

> The owner: *"I agree to build your Proposal: the sections as plane cuts, and the gizmo travels on them. One thing: I insist the contours shall be closed
> loops and cannot be infinite loops due to throw off by singularities or slanted faces … I also believe the camera shall roll at each edge crossing to
> align the camera view with the contour line of the next face … update the specifications for the tilted orbit. Await my authorization to build."*
> It supersedes §5's Steps 6–7 (the facet frames turned at each edge) and §19 / §20's frame machinery; §20.1's decisions stand (no hold; (b) the camera
> aligned with a cap's axes — here by construction, item 4).

### 21.1 Why (the owner on the device, 2026-11-05)

The lines drawn were SWEEPS of the current frame's face map (the green: the gizmo at every yaw at the pitch held; the red: at every pitch at the yaw held).
The map is a polar grid about the frame's axis: a sweep is straight only across the faces that frame maps as its columns — over the frame's caps or the
next frame's faces it bends or slants (the red slanted on the wall while on a top); it ignores the frame turn a real travel takes at each edge (so it
shows paths no input follows — the owner's attachments 3 and 4: *"not real because no combination of delta position travels can follow those two
contours"*); it is re-drawn in the new frame at every turn (the line snapped at the crossing); near a frame's pole it can run off unclosed. The root: the
lines come from the angle grid, the travel from a turn rule the grid does not hold.

### 21.2 The design

1. ⭐⭐⭐ **THE SECTIONS ARE PLANE CUTS of the faces contour** (Step 5's convex outline): the GREEN — the plane through the gizmo spanned by the face's
   normal and its dx axis (`t`, level); the RED — the plane through the gizmo spanned by the normal and its dy axis (`b`, up the face). On a box
   (`Scene_1`) world planes (`x = c`, `y = c`, `z = c`): every line an append of world-axis segments.
2. ⭐⭐⭐ **ALWAYS A CLOSED LOOP, NEVER INFINITE** (the owner's condition — confirmed): a plane through the inside of a CONVEX solid cuts it in exactly ONE
   closed convex polygon, one side per face crossed — finite, closed by construction; a slanted face only adds or reshapes a side; no angle, so no pole
   to throw it off. ⭐ The degenerate case — the gizmo on an edge, the plane lying along the neighbouring face (`x = c` at the box's side itself) — is
   excluded by placing every cutting plane at least **1 mm inside** the contour (vectored). The real surface (D3's depth, a protrusion, §18's bridged void)
   offsets the DRAWN line along the face's normal; the PATH is the convex loop.
3. ⭐⭐⭐ **THE GIZMO TRAVELS THE LINE DRAWN**: a dx moves it along the green polygon, a dy along the red, by arc length at the orbit's pace (mm on the
   contour per mm of finger); through an edge it simply goes on along the same polygon (the edge's slow stretch kept) — a sustained dx or dy loops the
   same closed section for ever (I3); the line is the path, exactly. The finger read on the SCREEN — see 21.4 (the roles, the camera, the stop).
4. ⭐⭐ **THE LINES CHANGE ONLY WITH THE INPUT**: under a pure dx the green is fixed (the gizmo rides it) and the red, through the gizmo, slides along with
   it (each position a world-axis plane cut); under a pure dy the reverse; a mixed input moves the gizmo off both — both slide with it, their shape
   world-axis. Nothing is re-drawn at an edge or a singularity: a plane cut has neither.
5. ⭐⭐ (⚠ refined by 21.4, which governs) **THE CAMERA'S ROLL — at exactly two kinds of crossing** (the owner proposed *"a roll at each edge crossing to align the camera view with the
   contour line of the next face"* — infirmed as a rule for EVERY crossing, kept as the principle): on a box every plane cut meets every edge SQUARELY (a
   dx line runs level across vertical edges, a dy line vertical across horizontal ones), so turning about the edge already leaves the next face's line
   straight on the screen — no roll. A roll is owed only where that turn leaves the view at odds with the next face's line: **a quarter roll from a top
   (bottom) onto a wall over a SIDE edge by dx** (§4.3 — the wall upright); **a half roll over a top's (bottom's) FAR edge by dy** (§4.1 — the far wall
   not upside down). Onto a top or a bottom nothing rolls: the crossing is square and the camera's up already lies along the cap's axes — §20.1's choice
   (b) by construction. On a non-box contour (slanted faces, a hexagonal prism) a line can meet an edge obliquely: the rule generalises to *roll so the
   next face's line is straight on the screen*, the roll that angle. ⭐ Each roll taken over the edge's slow stretch (the last 10 mm), the piece never
   waiting (the owner rejected the waits). On every face that is not purely horizontal the scene upright (§4.5) — on a box it follows from the two rolls.
6. ⭐⭐ **THE PIECE AND THE CAMERA FROM THE PLACE**: the piece's direction the face's normal at the gizmo, turned through the dihedral over the edge's slow
   stretch, the calm kept (§13); the shell (Step 2) and the support lift (§18) unchanged; the camera behind the piece, its up the face's dy axis (the
   red's direction on the screen — gravity on a wall, the cap's axis on a cap), rolled per item 5.
7. ⭐⭐ **THE COLLISION SOLVER, RE-ADDRESSED** (unchanged in what it does): it takes where the finger wants the piece, tries small moves, measures the
   distance to the parts and stops or slides along a part. Today it writes the piece's place as two numbers (round the assembly, up it); here the two
   numbers become the arc lengths along the green and the red. The solver never reads their meaning (its moves and measures are numerical) — no new
   collision rule, the same 24-query budget. What moves to the new pair is the bookkeeping that stores or eases the place: the finger's target, the eye's
   spring, the camera's lag, the height kept after a contact, the slide's way out.
8. **DELETED**: the face map's angle grid as the travel (columns, cap quarters, pitch bands — kept, if at all, only to find the facets), the frame turns
   (`orbit_frame.ts`: `frameStep`, `capExit`, `holdPitch`, the re-bases, `gizmoAnglesAt`), the map's angles and their sync (`asmMapQ`, `syncAngle`), the
   hold. ⚠ It resembles the carrier deleted at Step 4c-bis — but that carrier rode the HULLS of the real sections (bridging grooves and gaps: it waited,
   held, drifted and jumped); this one rides the CONVEX faces contour, whose plane cuts are exact closed polygons; the real surface only offsets the depth.

### 21.4 THE FINGER, THE CAMERA AND THE STOP — the owner's rules (2026-11-05), governing items 3 and 5

> The owner: *"always align the dy with red section travel and dx with green section travel and always maintain the scene upside up: for that, tilt or
> roll the camera at the edge crossing as required. If at one point the delta input is inverted (dx to the right would send gizmo to the left, dy upwards
> would send gizmo downwards), stop the delta input until the user reverse the delta input or chooses the other delta input (if it is sending the gizmo in
> the correct direction)."* — and, on the screenshot of a wall seen at a yaw: *"a roll is required to align the camera view with the horizontal portion of
> the red section so that the rule to align delta position input and gizmo travel is complied with"*.

* **R1 — THE ROLES ARE THE SCREEN'S.** At every moment the RED is the plane cut whose line at the gizmo runs along the screen's vertical, the GREEN the one
  along its horizontal; **dy travels the red, dx the green, each the finger's way on the screen** (I5 always). ⭐ Measured by a probe check at every frame:
  the angle between the red line's screen direction at the gizmo and the screen's up (and the green's and the screen's right).
* **R2 — THE SCENE UPSIDE UP.** On every face that is not purely horizontal the world's up is the screen's up (§4.5); on a top / a bottom (looking down /
  up) the up is the one the camera carried over the edge it crossed.
* **R3 — TILT OR ROLL AT THE EDGE, AS REQUIRED.** Crossing an edge the camera TILTS about it (the view swings over the edge — the image does not spin).
  The camera is built in the face's OWN axes (the dx line, the dy line, the normal; its sideways angle measured about the face's dy line, never the world's
  vertical), so a square crossing maps the view of one face onto the next by the same rotation and R1 holds with the yaw kept — ⚠ the owner's screenshot
  is TODAY's orbit, whose yaw is about the world's vertical: there a roll is owed (Step 6's roll owed); here it comes out as zero. Wherever the tilt leaves
  R1 or R2 broken, the camera ROLLS over the edge's slow stretch (the last 10 mm, tied to the place in the stretch — reversible, no wait): on a box a HALF
  roll at a top's / bottom's FAR edge (the far wall upright), a QUARTER roll at its SIDE edge (the side wall upright); on a non-box contour whatever angle
  makes the next face's line screen-straight. ⭐ After a roll R1's roles are READ AGAIN — a line may change colour: after the quarter roll at a side edge
  the loop the dx was following runs along the screen's vertical, so it is now the RED (continued by dy down the side wall), and the screen's horizontal
  line through the gizmo the green.
* **R4 — THE STOP.** Whenever the finger's input would move the gizmo against the finger on the screen (inverted, or with no component along its line —
  mid-roll, a role just changed), that input is STOPPED: the gizmo waits — until the finger reverses, or the other input moves it the finger's way. ⭐ A
  test at every step, never a latch: it lifts at once (⛔ not §20's hold, which refused a cap for the rest of a drag — the owner's *"no hold"* stands).
* **What it gives, on a box** (the owner's walk): up the front by dy → TILT over the top edge, dy still up the screen across the top, the yaw kept, no roll
  → at the FAR edge the HALF roll over the last 10 mm; read again, the red line through the gizmo runs back across the top up the screen: dy kept up sends
  the gizmo back along its previous track (the owner: *"the dy upwards will need to send back the gizmo to the previous track (otherwise, the scene will
  end up upside down)"*), dy down crosses the far edge, the camera tilts down over it, the far wall upright. By dx toward a top's SIDE edge → the QUARTER
  roll; the dx then stops there (R4: its line is vertical on the screen) and dy down goes on down the side wall (the same loop, now the red); dy up back
  across the top. ⛔ This supersedes item 3's earlier *"after a half roll the same finger kept on comes back … no hold"* where it differs (the stop is R4's)
  and §20.1's open side-edge question.

### 21.3 Build order and gates (each with its vectors, RED on the code before it, and the probes)

1. **The cut** (engine-free): a convex contour × a plane → its closed polygon (ordered, closed, finite; 1 mm inside); arc length ↔ point; the face, its
   normal and its axes at a point. Vectors: a box (world-axis loops), a horizontal and a vertical hexagonal prism (slanted faces), a plane on an edge
   (the 1 mm rule), every loop closed, no length beyond the contour's girth.
2. **The travel**: the state (the place, the green and red planes); dx / dy along their polygons by arc length, read on the screen with R1's roles and
   R4's stop; the edge's slow stretch; the lines drawn from the same polygons (real depth along the normal).
3. **The piece and the camera from the place**: the direction, the calm, the camera in the face's own axes, R3's tilt and rolls over the slow stretch, R2.
4. **The solver re-addressed**: the two arc lengths; the bookkeeping moved (target, spring, lag, height kept, slide's way out).
5. **The deletions** (item 8).
Gates: the 13-run traversal matrix and the off-square set (`orbit_probe.mjs`, `analyse_orbit.mjs`, the tilt check) — tilted / upside-down 0; every line
closed (a new check: the drawn polygons' closure and length); I1 (the gizmo within 3 mm of its plane on constant legs — every face, the caps included); I3
(no reverse, no stuck but the half roll's reversal and R4's stops); ⭐ R1's alignment angle at every frame (the red's screen direction against the
screen's up — new); the scene upright on every wall (the tilt check); back-and-forth, blockages, jumps and against-the-finger at or under §20's. ⛔ No device close until the
owner's look.

## 22. ⭐⭐⭐ THE CLEAN SPECIFICATION — the rebuild of the sections as plane cuts (2026-11-06, branch `1.0.103-` from `8dfa635`; the owner: *"proceed with rebuild"* — BEING BUILT, step by step)

> ⭐⭐⭐ **§29 (2026-11-07, BUILT): the track is the shell, the sections are ropes, the gizmo never waits — it supersedes §27.2 (G1 / G1s / Gz0 / Gz2) and §28.4.** ⛔⛔ **§28 (the deep debug): RC4 – RC5 put G1 (one plane per face) and the cast-built sections in question (RC6 withdrawn) — read it before touching them.** ⭐⭐⭐ **§27 (the track and the shell; deported faces) amends G1, P1 and Gz0 – Gz2.** ⭐⭐⭐ **§26 (the second rebuild, branch `1.0.104-` from `8dfa635`) REPLACES P2, C1 – C3, T5, Gz2 and Gz3 below** — the view by world yaw and pitch (no roll), the sections as plane cuts of the real parts, followable only.

> The owner (2026-11-06): *"I do not want fixes with logics which contradict each other. There are lot of proposed fixes with new rules and this seems to
> create such risk. I would prefer a full rebuild without adding new rules for fixes"* → *"I would rebuild from 8dfa635 with a clean specification in the
> md file"* → on the gizmo: *"I want the gizmo to be on the assembly faces, representing faithfully where the piece would land if I approach it with A + dy
> until collision. I do not want hidden gizmo nor gizmo floating in the air … (I do not mean by that the voids inside a face or at the edge of a face, for
> which we have already set rules for)"* → *"proceed"*.

### 22.0 Method — one owner per rule
Every behaviour below has ONE rule and ONE owner (a module), and no rule overrides another. A defect found later is fixed by changing the rule that owns
it — never by a second rule beside it. The build that followed `8dfa635` (branch `1.0.102-`, its record in that branch's §21.5 … §25 — kept there, not
here) failed by doing the opposite: the collision solver, the coast and the slide's way out each moved the orbit beside the travel's rules; two geometries
(the contour and the real parts) each decided where the piece may be; and each defect got a rule of its own (the shell's blend, the depth kept below the
contour, the contour pushed out, the slide's arming, the zenith flip, the roll mark…), each mending one case and breaking another.
§21.1 – §21.4 stand as the design's origin; what follows SUPERSEDES them where it differs (named in each rule).

### 22.1 The two geometries — one job each
* **G1 — THE TRAVEL CONTOUR** (owner: `input/face_map.ts`): Step 5's faces contour (the facets chosen by their main real face, D5 — the same normals, no
  tilt), each facet's plane then at the placed parts' SUPPORT along its normal (the farthest vertex): convex, closed, EVERY placed part inside it. It is
  what MOVES reads: the travel (22.2), the piece (22.3), the camera (22.4). (From `1.0.102-` §24.1.)
* **G2 — THE REAL SURFACE**: the placed parts on their model pose. It is what is SHOWN and REACHED: the gizmo and the lines (22.5), the approach's contact
  and the slide (22.6).
* **THE FLOOR IS IGNORED** by both — decorative; not drawn from below (`D128`). (From `1.0.102-` §25.) ⚠ The owner's decision D-1 (22.9): the LOOSE pieces.

### 22.2 The travel — who moves the orbit (owner: the travel module, engine-free)
* **T1 — THE SECTIONS ARE PLANE CUTS OF G1** (§21.2 items 1–2): through the travel's place, the GREEN plane spanned by the face's normal and its level axis
  `t`, the RED by the normal and its up axis `b`; each cuts the convex G1 in ONE closed convex polygon (1 mm inside; on a box, world-axis loops).
* **T2 — THE PLACE TRAVELS THE LOOPS** (§21.2 item 3): dx along the green, dy along the red, by arc length at the orbit's pace (mm on G1 per mm of
  finger), through an edge on along the same polygon. The roles are READ PER FACE (which loop is the screen's horizontal / vertical, seen square to the
  face with the face's own up — `1.0.102-` §21.5 F4), never from the rolling camera.
* **T3 — ONE CROSSING EVENT**: a finger's step is SPLIT at the first face change on its way; there, once and in this order: T5 (may the travel leave this
  face here?), the new face's roles read (T2), R4 (T4); then the rest of the step. (`1.0.102-` §21.5 F1.)
* **T4 — R4, THE STOP** (§21.4): an input that would move the gizmo against the finger is stopped until the finger reverses or the other input moves it
  the finger's way — compared on the gizmo's WORLD motion, the new face unfolded onto the old (`1.0.102-` §21.7). A test, never a latch.
* **T5 — THE VIEW HOLDS** (rewritten 2026-11-06 — the owner: *"any face contour that would result in upside down slanted camera view cannot be reached …
  the vertical faces would be reachable from the vertical face through dx"*): a step whose place would show the scene slanted or upside down is cut back
  to the last place that would not (`loop_travel.ts` `travelStep(…, allowed)`, `loop_camera.ts` `viewAllowed`) — the view leaving the 20° near-vertical
  cone where gravity's up would differ from the up carried in by more than 20°; every place a step ends on is checked (R4's stop too). On `Scene_1`: a dy
  over a top held just past its far edge (the far wall would be upside down), a dx along a top held where the view would leave the cone sideways; walls
  always upright, always free; the far faces by dx round the walls. ⭐ Vectored on five shapes (`view_reach.test.ts`: the painting, a vertical and a
  horizontal hexagonal prism, the green piece's frustum, a squat pyramid whose sides are all "caps" by their normals): every facet reached from a wall,
  no view reached slanted past the margin; without the rule the same search reaches views 60°+ off. ⛔ (§23) A cap a terminus by its edges — blind to the
  view's lean ON the cap (the scene turned up to 90° on a top) and to a squat pyramid (held on its first side).
* **T6 — ONLY THE FINGER MOVES THE PLACE**: the finger's steps through T3, and its coast replayed through T3 as further steps. Nothing else writes the
  place — no collision solver, no relocation, no re-base, no slide way-out moving it behind the travel's back. (Supersedes §21.2 item 7.)

### 22.3 The piece (owner: the placement module)
* **P1 — OUTSIDE G1, ALWAYS**: the piece is placed from the travel's place along its direction at the approach's distance, its nearest point (its support
  toward G1 — §18 item 4's lift) never inside G1. G1 enclosing every placed part, THE ORBIT CANNOT TOUCH A PART: no collision solver in the orbit
  (supersedes §21.2 item 7's re-addressed solver). ⛔ The shell (Step 2) and its foot blend deleted — G1 is already the smooth enclosing surface.
* **P2 — ITS DIRECTION, A FUNCTION OF THE PLACE** (the owner, 2026-11-05: *"when I travel on dx on the vertical front contour, the orbit is fast on the
  left, then … switches to almost slide until the 2nd third of the face then it resumes another fast orbit … same thing when I travel dy. We need to
  better blend the orbit and slide"* → *"B. build the smooth profile"*): the smooth profile (`1.0.102-` §21.8: the shown angle `Θ·(s·x + (1 − s)·x³)` of the pace share, the
  face's gnomonic direction — continuous at every edge and corner). On a cap, along its entry side, the cap's profile — from the entry edge's bisector (C1
  with the wall) to straight above / below ONLY at the far edge (`1.0.102-` §23); across a cap its own odd profile (the gnomonic continuity at every edge).
* **P3 — ITS RESTING FACE TURNED BY G1's FACE NORMAL** (`1.0.102-` §22, the owner's choice: the contour's normal).

### 22.4 The camera (owner: the camera module)
* **C1** — behind the piece along its direction, the owner's yaw / pitch offsets about it.
* **C2 — ITS UP, FROM THE VIEW** (rewritten 2026-11-06 with T5): outside the 20° near-vertical cone gravity's up — the scene upright on any face, a slanted
  one or a steep top alike; inside the cone the up carried in from where the view entered it (`upTarget`, `nextCarried`) — no roll; turned at the
  camera's pace (`cameraRollDegPerS`). ⛔ A cap's carried axis whatever the view's lean (the scene turned on a top's side, R2 against P2).
* **C3 — NEVER PAST A CAP'S ZENITH**: the camera itself (its offsets included) never beyond straight above / below toward the far edge (`1.0.102-` §25).

### 22.5 The gizmo and the lines — SHOWN, never moving anything (owner: the display module)
* **Gz0 — WHAT A FACE IS, PER LINE** (the owner, 2026-11-05: *"it depends if the void is open or closed on the section travel: … the void is open on the red
  section travel so the orbit tilt shall take over … the void is closed on the green section travel so the green section and the gizmo shall go
  through"*): a face's region with its holes closed (the face map's one existing test) — and a void is part of the face FOR A LINE only when it is closed
  ALONG THAT LINE's travel (faces of that plane on both sides of it along the line: the green's `t`, the red's `b`). Open along a line, the void is
  BEYOND the face for that line. ⛔ The `1.0.102-` build bridged a void for BOTH lines when it was closed along EITHER — the owner's *"why the red
  contour extends into the void instead of adhering to the horizontal black face?"* (`f2aa456`, att. 2).
* **Gz1 — ON A FACE** (for the line travelled): the gizmo on the real surface under the place along the face's normal; over a void closed along that
  line — **straight across on the face's plane** (the owner: *"the green section and the gizmo shall go through"*); a slot's bottom when the slot is open
  along both lines and the place is inside the face's closed region (D3).
* **Gz2 — BEYOND A FACE** (for the line travelled: past the face's rim, or into a void open along it — and the strips G1 adds where no face of that side
  exists): the gizmo is **WHERE THE PIECE WOULD LAND — the nearest point of the assembly to the piece** (moved straight toward it, the piece first
  touches there — nothing else is nearer). On a real face, edge or corner; never hidden, never in the air (the owner: *"representing faithfully where the
  piece would land if I approach it with A + dy until collision"*). ⭐ Continuous with Gz1: just past a rim the nearest point IS the rim; into a void open
  along the line it turns onto the void's real faces — *"the orbit tilt shall take over"*. Where two parts are equally near (a ridge) the landing really
  changes and the gizmo with it; it keeps its part until the other is nearer by the collision skin (the existing tolerance).
* **Gz3 — THE LINES ARE THE GIZMO's PATHS** (§21.2 item 3: *"the line is the path, exactly"*; the owner: *"the gizmo stays on the red and green contour
  intersection … No dashed lines"*): the GREEN line is where a dx would carry the gizmo, the RED where a dy would — each by Gz0–Gz2 for its own line,
  through the gizmo, solid. The ring on BOTH lines by construction. ⚠ The owner's decision D-4 (22.9): the gizmo inside a void closed along one line and
  open along the other.

### 22.6 Contact — the approach and the slide (owner: the contact module)
* **A1 — THE APPROACH** (A + dy, two fingers): straight from the piece to the gizmo — along the face's normal under Gz1, toward the nearest point under
  Gz2 — collision-checked (1-D: in until contact, out back to G1). It ends at the gizmo: over a void bridged by Gz1 it does not go into the slot (§18's
  stated cost, kept).
* **A2 — THE DEPTH DECIDES THE MODE, NOTHING ELSE**: the piece outside G1 — a drag ORBITS (22.2); brought in by the approach — a drag SLIDES on the face it
  touches (`HOVER.md`'s slide), left only by the approach out. ⛔ Supersedes the slide's auto-latch, its arming / disarming (`1.0.102-` §24 A) and the
  depth kept below the contour (`1.0.102-` §22 (a)): there is no orbit below G1.

### 22.7 Deleted from the base (`8dfa635`)
The frame turns and their machinery (`orbit_frame.ts`: `frameStep`, `capExit`, `holdPitch`, the roll owed, the re-bases, `gizmoAnglesAt`); the face map's
angle grid as the travel (`mapTarget` as the place, `asmMapQ`, `syncAngle` — the facets and regions kept); §20's up from the view; the shell and its
foot; the piece-orbit solver in the assembly orbit (its slides, relocations and target resets — kept only where `orbitMode` 1 uses it); the slide's
auto-latch; the stack's frontmost-group depth rule where Gz1 / Gz2 replace it; every slider whose rule is deleted.

### 22.8 Every issue reported since §21, and the rule that removes it by construction
| reported (branch `1.0.102-`) | root | removed by |
|---|---|---|
| the red misses the black face; the red into the void (`f2aa456` att. 1–2) | lines on the contour's plane; a void bridged for both lines when closed along one | Gz0 (a void per line), Gz3 (the lines the gizmo's paths, on the real surface) |
| jitter, back-and-forth, sways at protrusions and overhangs (att. 3–5) | the real depth moved the piece | P1 (the piece on G1 only), Gz (display only) |
| dy stops over a top (§21.9); a roll on a top; a leak off a top's side edge | B's zenith flip against R4; the up's gravity rule on a cap; the terminus checked for the finger only | T5 at T3 (one event), C2 (R2 on a cap), T6 |
| slowed movement close in (the slide ~10× slower mid-drag) | the slide's auto-latch | A2 |
| *"almost stuck"*, blocked dx / dy, sideways drift, the red section jumping, front↔back hops (`77e56dc`, `ad5d1b1` att. 1–3, 7–8) | the solver refusing / sliding / relocating against parts proud of the face; the depth kept below the contour | P1 (no solver in the orbit), A2 (no orbit below G1), T6 |
| the gizmo 30 cm down, or outside the top / bottom face (`ad5d1b1` att. 6, far and near) | the ring cast to whatever lay below G1's strips | Gz2 (the landing) |
| the gizmo jumping back to the previous edge on the slanted part; the frame flicker at an edge | the solver resetting the target against the terminus and the frame | T6 |
| the camera ~11° past the zenith at a held far edge | the offsets beyond the piece's direction | C3 |

### 22.9 The owner's decisions — the proposals ADOPTED as defaults at the owner's *"proceed with rebuild"* (2026-11-06), each revisable on the device
* **D-1 — THE LOOSE PIECES** (on the floor, not placed — `Piece41`): G1 encloses the PLACED parts only. ⭐ Proposed: the orbit ignores them like the floor
  (they lie away from the assembly); the approach (A1) and the slide collide with them. The alternative brings a solver back into the orbit (against P1).
* **D-2 — ⛔ WITHDRAWN while building Step 3 (2026-11-06; the R2 / P2 conflict it aimed at resolved by T5 / C2 rewritten on the view)**: *no sideways lean on a cap* contradicted P2 — a dy crossing onto a top off the face's middle
  would see the wall's sideways lean drop to 0 at the edge (the gnomonic continuity broken). The owner's own R2 (§21.4 — on a cap the up carried over the
  edge) removes the roll instead, with no new rule: C2.
* **D-3 — THE PACE ALONG THE LOOPS**: arc length on G1 per mm of finger at the orbit's present pace (`Scene_1`: the same speed far and close), with the
  edge's slow stretch (§15) and the smooth profile's pace (P2) — or a slider.
* **D-4 — THE GIZMO IN A VOID CLOSED ALONG ONE LINE, OPEN ALONG THE OTHER**: the line TRAVELLED decides (the owner: *"if the green line goes straight
  through the void the gizmo goes straight through, if the red line turns to the other face the orbit tilt occurs and the gizmo follows the red line"*);
  the other line is drawn through the gizmo. ⭐ Proposed: a switch of input inside such a void carries the gizmo onto the new line's place at its first
  step (the only place two lines can disagree; a visible step there, nowhere else).

### 22.10 Build steps and gates (each step: its vectors RED on the code before it; the series at its close)
1. **G1 and the cut** (engine-free): the support planes; a convex contour × a plane → its closed polygon; arc length ↔ point; the face and its axes at a
   point (§21.3 step 1's vectors, and G1 encloses every part).
2. **The travel** T1–T6: the place, the two planes, the roles per face, the one crossing event, R4, the terminus, the coast through T3.
3. **The piece and the camera** P1–P3, C1–C3.
4. **The gizmo and the lines** Gz1–Gz3 (the nearest point: the existing GJK distance query).
5. **Contact** A1–A2; the solver out of the assembly orbit.
6. **The deletions** (22.7).

**The series at every close** (`orbit_probe.mjs` — now recording the ring's distance to both drawn lines, the cutting planes and the collision verdicts —
and its analyser): 4 distances (far, mid, close, VERY CLOSE — at the contact) × dx, dy at 3 and 12 px a frame, mixed; across the edges, voids,
protrusions, overhangs, the slanted part, the corners, the tops and the bottoms. **Gates** (the owner's checklist, 2026-11-05 / 06): upside-down 0;
slanted (tilted) views on a wall 0; jumps of the piece or the camera only at a Gz2 ridge (named); stuck — stalls only at T5's holds and R4's stops;
SLOWED movement — none (the piece's pace close in that of far out: no slide mid-drag, no solver); the gizmo not at the red / green intersection (the ring
over 3 mm off a drawn line) 0; the gizmo back-and-forth 0; a section thrown to another place on the face (a cutting plane > 20 mm in a frame, the same
normal) 0; relocations 0; touching during an orbit 0; the camera's up stepping (> 8° a frame) 0; THE CALM — on a dx across a wall and a dy up it, and on a
top / a bottom: the shown angle's step grows evenly from the face's middle to its edges and on across the edge at the same pace (no orbit – slide –
orbit). Then the root causes analysed in common before any fix — a fix changes the rule that owns the cause (22.0). ⛔ No device close until the owner's
look.

**Build status (2026-11-06, `1.0.103-`, uncommitted)** — the engine-free foundation first; nothing wired yet (the app still runs `8dfa635`'s orbit):
* ✅ **Step 1** — G1 (`face_map.ts` `buildFaceMap`: each chosen facet's plane at the parts' support, ported from `00c9514`) and the cut (`plane_cut.ts`,
  ported from `d999080`, + the loop by ARC LENGTH: `loopLength`, `loopPoint`, `loopArc`). Vectors RED against `8dfa635`: G1's three (the base's planes
  at the main face), `plane_cut` (absent).
* ✅ **Step 2, engine-free** — `loop_travel.ts`: the face's frame (a wall's gravity, a cap's carried axis), the component's loop read per face (T2), the
  pace (each side its slice of the turn, the edge's slow stretch), one crossing event (T3), R4 (T4, the world motion unfolded), the terminus (T5); the
  other plane re-derived square to the loop. Vectors: dx round the walls (a quarter turn per face, the height kept, back to the start), dy onto the top
  and held at its far edge, the top's side edges held, the slow stretch, the loops closed. ⚠ R4 cannot fire on a box under T5 (no crossing turns a
  component past 120°) — its vector waits for a slanted contour case in Step 2's wiring.
* ✅ **Step 3, engine-free** — `loop_calm.ts` (P2: the smooth profile, the cap's profile — ported from `1.0.102-`), `loop_camera.ts` (C2: ⭐ on a cap the
  carried axis whatever the lean; the pace; C3 the zenith clamp — ported; T5's copies deleted there: `loop_travel.ts` their one owner). D-2 withdrawn.
* ✅ **Steps 3 – 6, wired** (the owner: *"build all the rebuild"*) — `render/assembly_wiring.ts` rewritten: G1 and the travel's state (`st.loop`); the
  finger the ONLY mover (`loopFinger` from the drag and the coast — T6); the shown place and direction on the orbit's critically damped spring
  (`springPoint`, `follow_camera.ts`: ⛔ a plain exponential showed each pointer event's step); P1 — the piece outside G1, the collision solver skipped
  in this mode (`green_box_wiring.ts`); C1 – C3 — the camera along the SHOWN direction (never the orbit's angles: no pole), its up paced toward the face's
  target, clamped at a cap's zenith; Gz0 – Gz3 — the gizmo by `input/gizmo_rule.ts` `gizmoCase` (⭐ a real face counts only AT the face's plane or proud of
  it — never a void's floor behind it, vectored), the parts' nearest point by GJK (`separationBetween` of a point and a hull), the lines the gizmo's paths
  along the two loops; A1 — the approach above G1 along the direction, below it straight toward the gizmo (`approachRange().floor`, `approachAt` from
  `1.0.102-` §22); A2 — the depth arms the slide; ⭐ **A2 completed while probing**: below G1 the orbit never runs — without a slide (it latches only where
  the resting face looks at a face: at a wall with the resting face down, never) a drag takes the piece back OUT to G1 at the drag's pace, then orbits
  (⛔ the drag refused: every close-in run DEAD). ⭐ The boot place on the facet the orbit's boot direction faces (⛔ the spawned piece's position, far out
  on −x before the orbit placed it). **Deleted** (22.7): `orbit_frame.ts`'s turns (its upright frame kept — the slide reads it), `section_hull.ts`, the old
  `orbit_calm.ts`, §20's `camera_up.ts`, the shell's foot (`orbit_shell.ts` keeps `shellBox`, `faceLift`), the face map's angle grid (`mapTarget`,
  `mapAngles`, `blendThroughEdges`, `stackDepthAt`, `syncAngle` …), the lock cone and the face switch (`assembly_orbit.ts`), the sliders
  `gizmoEaseMs` and `faceSpanZone*`; the slider `cameraRollDegPerS` added (C2's pace). Vectors: `rebuild_wiring.test.ts`, `void_bridge.test.ts`'s Gz0 per
  line; the dead vectors of the deleted rules removed with them.

**The travel series on the rebuild** (16 runs: far / mid / close / at the contact × dx, dy at 3 and 12 px a frame, mixed; ~27 000 frames, 0 page errors;
the analyser now counts the tilt on a WALL apart from a cap's, and a section "thrown" only beyond the gizmo place's own motion along its plane's normal —
a plane slides with the place by design). First run: every close-in run DEAD (A2's gap, above) and the boot on the −x side; fixed, second run:

| gate | result |
|---|---|
| upside-down on a wall / slanted (> 30°) on a wall | **0 / 5** frames (mixed legs, 30–41°) |
| the ring off a drawn line (> 3 mm) · a section thrown · relocations · touching during the orbit | **0 · 0 · 0 · 0** |
| back-and-forth: piece / camera / the gizmo's place | **0 / 0 / 0**; the shown ring 22 (its depth on the real surface) |
| the up stepping (> 8° a frame) | **0** |
| against the finger | 3 |
| stalls | T5's holds only, and ~43 frames when a drag first takes the piece out to G1 (A2) |
| the pace close in | 4–9 mm a frame (no slide mid-drag, no solver) |
| camera / piece jumps | 45 / 19 — on the fast dy far out (2–3.6 m at 6 m): the input arrives in bursts in the headless browser (80–180 ms frames), the spring smooths most |

✅ **RESOLVED (2026-11-06, T5 / C2 rewritten on the VIEW)** — was open, R2 against P2 on a cap: with a dx along a top the view leans sideways (P2's smooth profile, up to the bisector at the
side edge) while the up stays the axis carried over the entry edge (R2, no roll): seen from the side the scene appears turned up to ~90° — 999 frames
past 90° and 6 338 past 30° against gravity, all on caps. Removing the lean (D-2) breaks P2's continuity at an off-middle crossing; gravity's up there
brings the roll back. **1620 vectors.**

### 22.11 The owner's feedback since `8dfa635` — each captured, or what superseded it
| when | the owner | where it lives now |
|---|---|---|
| 11-05 14:49 | *"is there a slider for the 10mm for the camera roll to catch up ?"* | ⛔ no roll anywhere (T5); the up's own pace keeps its slider `cameraRollDegPerS` (C2) |
| 11-05 16:00 | *"F1: if the delta position would drive the gizmo in an opposite direction, hold the input … this overrules anything else. F3: as you recommend … don't patch … re-build §21 properly"* | F1 → T3 (one crossing event) + T4 (R4: no other rule moves the gizmo against the finger — T6 removes every other mover); F3 (the camera square to a cap) superseded by P2's cap profile (the owner's B, then §23) |
| 11-05 16:00 | *(mid-turn)* *"when you have finished … perform the same travel series … analyze the common logic flaw root causes, propose fixes avoiding patching"* | 22.10's series and gates, at every step's close; 22.0 |
| 11-05 18:34 | *"do all"* (F5 the direction from the place, F6 the roll mark) | F5 → P2 (a function of the place); F6 ⛔ superseded (no roll) |
| 11-05 20:18 – 20:22 | the calm: orbit – slide – orbit on dx and dy; *"check if this is the same"* on a horizontal face; *"B. build the smooth profile"* | P2 (the smooth profile), its gate in 22.10 (walls and caps); B's zenith roll ⛔ superseded by T5 |
| 11-06 05:21 | *"the stop over the top: we will fix it later on"*; the geometry fixes: *"patches … or … re-build ?"* | T5 (no stop mid-top: no roll to stop for); 22.0 |
| 11-06 (`f2aa456`, mid-turn) | att. 1 *"why the red section does not pass through the black face"*; att. 2 *"why the red contour extends into the void … which rule imposes that"*; att. 3–4 jitter and back-and-forth under an overhang; *"Analyze the common root cause. Propose common fixes"* | Gz0, Gz3 (att. 1–2); P1 + G1 (att. 3–4: the real surface never moves the piece) |
| 11-06 (mid-turn) | *"dy run the red section loop around the assembly … back-and-forth of gizmo (especially at high dy speed) and sways of the piece and camera"* | P1, T6, the gate *back-and-forth 0* at 12 px a frame |
| 11-06 (mid-turn) | *"build f0e8bd7 : the orbit is stuck … (dy travel)"* | T5 (no zenith roll to hold behind) |
| 11-06 05:33 | *"build with contour's normal and (a) close in"* | the contour's normal → P3; (a) ⛔ superseded by A2 (no orbit below G1 — it caused the close-in stalls) |
| 11-06 (mid-turn) | the cap simplification: *"do not roll the camera anywhere: just extend the slide portion of the orbit up to the furthermost far edge and then hold the dy further … the user can dy back … to reach the opposite faces … dx 180 degrees on the vertical faces"* | T5 + P2's cap profile |
| 11-06 06:47 | *"When the piece is close to the hosting face or close to the protruding part, the movement is very much slowed down … I don't like at all this feel"* | A2 (no slide mid-drag), P1 (no solver in the orbit); the gate *no slowed movement* |
| 11-06 06:48 | *"In the attached configuration the movement is almost stuck"* | P1, T6 |
| 11-06 (mid-turn) | *"Build A"* (the slide latches only from the approach) | A2 (the depth is the mode — stronger than A, no arming) |
| 11-06 07:57 | *"build it"* (the contour clear of every part) | G1 |
| 11-06 08:35 | *"the camera never past the zenith"*; *"the floor shall be ignored entirely"* | C3; 22.1 (the floor ignored) |
| 11-06 09:32 | dx blocked (att. 1–3); the slide latching by itself (att. 4) — *"can we avoid that by setting some slider value?"*; the gizmo jumping on the slanted part (att. 5); out of the bottom face, the green line gone (att. 6); back-and-forth and stuck (att. 7); the red section jumping, *"as if the piece was frictionning"* (att. 8) | 22.8's rows: P1 / A2 / T6 (1–3, 7, 8); A2 (4: no auto-latch to tune); T6 (5); Gz2 (6) |
| 11-06 (mid-turn) | *"same issue of the gizmo outside the bottom face at further distance"*; *"… outside the top face"*; *"when I cross the slanted part with dx … the gizmo jumps backwards to the previous edge"* | Gz2; T6 |
| 11-06 (mid-turn) | *"there is no stop of the camera roll when I cross the horizontal faces … there should not be a camera roll and the dy hold should be done before the camera roll"* | T5 at T3 (the hold decided at the one crossing event, before anything turns), C2 (R2 on a cap: no roll), T6 (nothing crosses behind the finger) |
| 11-06 09:44 | the series checklist: *"jumps, upside down or slanted camera views, stuck, slowed movement, gizmo not at red and green sections intersections, gizmo back and forth, red or green sections thrown off to different place on the face"*; *"several distances including very close distance"* | 22.10's gates, one each |
| 11-06 09:46 | *"I do not want fixes with logics which contradict each other … a full rebuild without adding new rules for fixes"* | 22.0 |
| 11-06 09:53 – 09:54 | the gizmo *"on the assembly faces, representing faithfully where the piece would land if I approach it with A + dy until collision … not hidden … not floating"*; *"(I do not mean by that the voids inside a face or at the edge of a face, for which we have already set rules for)"* | Gz2; Gz0 – Gz1 (the void rules kept, per line) |

## 26. ⭐⭐⭐ THE SECOND REBUILD — THE VIEW BY WORLD YAW AND PITCH, THE SECTIONS AS PLANE CUTS OF THE REAL PARTS (2026-11-06, branch `1.0.104-` from `8dfa635`)

> The owner (2026-11-06), on `1.0.103-` (build `1924bd4`): *"when I am on bottom face and try to go up with dy on red section, sometimes the gizmo gets
> stuck"* → *"the red section passes in the void to reach the protruding edge then again in the void … Why did you break my rules ? What other rule
> conflicts with my rule ?"* → *"You should not display sections which are not followable by the gizmo"* → *"the green section updates with a notch …
> This again breaks the rule that the sections shall be planes"* → *"there shall be a lean only if the next contour face can be reached"* → *"the lean can be
> in world pitch, yaw or roll … the purple camera can lean on world pitch (1) to anticipate the dy on bottom face … on world yaw (2) to anticipate the dx
> on the vertical face to the left. The lean which is not permitted is the (3) which is on the world roll axis … Make sure not to patch and rebuild entirely
> if needed, so the rules stay clean and no rule conflicts with another"* → *"(i) The heading follows the wall's at the same left/right position … Rebuild
> from 8dfa635 making sure you capture all my feedbacks"*.

**§22 stands except where this section replaces it** (each replacement named). §22.0's method binds: one owner per rule, a defect fixed in the rule that
owns it. **Carried from `1.0.103-` unchanged** (their rules stand): G1 and G2 (22.1), the cut (T1), the travel T2 – T4 and T6, P1, P3, A1 – A2, the
boot, the spring of the shown place. **Written new**: the view (P2, C1 – C3, T5 — 26.2 – 26.3), the gizmo and the lines (Gz — 26.4).

### 26.1 What the first rebuild got wrong — rules of mine that broke the owner's
| the owner's rule | broken by (mine, §22) | how |
|---|---|---|
| *no camera roll* (11-06); a lean only toward a reachable face | P2 + C2 + T5: the view leaned sideways on a top / a bottom (the gnomonic profile), the up kept from the entry inside a 20° cone, a hold where they disagreed | a dx on a bottom parked the view on the cone's side rim; from there every dy step was refused (*"the gizmo gets stuck"*) |
| *a void at the edge of a face stops the section there; a void closed along it is crossed* (`1.0.100-` §18, D3 amended; Gz0) | Gz2 (beyond a face, the parts' nearest point) on G1 pushed to the support | the top's contour plane above the black edge, the nearest point on the protruding parts: the red ran into the void to them and back |
| *the sections are planes* (§21.2) | Gz3 (the lines the gizmo's paths) + Gz2; the lines cut through the TARGET place while the gizmo was at the SHOWN one | the lines left their plane at every Gz2 jump; a notch at every start of a drag (the plane moved, the gizmo not yet) |
| *do not display a section the gizmo cannot follow* | the lines drawn round the whole loop, blind to the travel's stops | the green on a bottom drawn past where dx stops |

### 26.2 THE VIEW — WORLD YAW AND PITCH, NEVER ROLL (replaces P2, C1 – C3; owner: `input/loop_view.ts`)
* **V1 — TWO ANGLES**: the piece's direction from the place (and so the camera's) is a world **yaw** `h` (round the vertical) and a world **pitch** `e`
  (above / below the horizontal) — nothing else. **No roll exists**: the camera never tilts sideways about the axis it looks along (the owner's camera 3).
* **V2 — THE UP FROM THE TWO ANGLES**: the screen's up is the direction's own pitch tangent `(−sin e cos h, cos e, −sin e sin h)` — the scene upright at every
  yaw and every pitch, straight above / below included (the yaw tells which way is up there). ⛔ Deleted: the 20° near-vertical cone, the carried-in up,
  the up's pace and its slider `cameraRollDegPerS` (§22.4 C2) — they existed because the view could roll.
* **V3 — THE LEAN ANTICIPATES ONLY A REACHABLE FACE, ON ITS OWN AXIS** (the owner's cameras 1 and 2): on a WALL (any facet whose normal has a heading —
  more than 10° off the vertical; a slanted face included) a **yaw** lean toward the faces dx reaches (its level sides) and a **pitch** lean toward the faces
  dy reaches (its top and bottom sides); at a corner both at once. Each lean grows by the smooth profile (`1.0.102-` §21.8: `Θ·(s·x + (1 − s)·x³)`, the
  calm's sliders) from the face's middle to the BISECTOR of the face and its neighbour at the edge — so both faces give the same yaw and pitch at their
  common edge.
* **V4 — A TOP OR A BOTTOM** (a facet whose normal is within 10° of the vertical — a CAP): no face is reachable by dx (its side faces would need a roll),
  so **dx never leans the view**; dy leans in **pitch only**, from the entry wall's edge view to straight above / below at the far edge (§23's cap profile,
  C1 with the wall). ⭐ **The yaw on a cap is the entry wall's at the same left / right position** (the owner's choice (i)): a dx on a cap yaws the camera as
  it would on the wall just below / above, so the view leaving by any point of the entry edge is the wall's there.
* **V5 — THE CAMERA** (replaces C1, C3): behind the piece along `(h, e)`, the owner's offsets turned in its own frame (the pitch added to `e`, the yaw about
  the up) — the pitch never past ±90° (**never past the zenith**: §25's rule by construction).
* **V6 — THE SHOWN VIEW**: the yaw and pitch eased toward the travel's on the orbit's critically damped spring (the shown place's, `orbitSpringMs`).

### 26.3 T5 — A FACE IS REACHED ONLY WHERE THE VIEW IS CONTINUOUS (replaces §22.2 T5; owner: `input/loop_travel.ts`, the view `loop_view.ts`)
At the one crossing event (T3) the view just before the edge (the old face's) and just after it (the new face's) are compared — direction and up: the
crossing is taken when they are the same view (within 3°), else the travel stops AT THE EDGE (a test at every step, never a latch). This is the owner's
*"a lean only if the next contour face can be reached"* read the other way round: a face is reachable exactly where the leans meet. On a box: every wall
from every wall (yaw), a top / a bottom from a wall (pitch) and back to its entry wall; **never** a cap's far wall (the yaw would turn over at the zenith —
reached by dx round the walls) nor a cap's side walls (a roll). ⭐ Vectored on five shapes (`view_reach.test.ts`): every facet reached, no view stepping.

### 26.4 THE GIZMO AND THE LINES — PLANE CUTS OF THE REAL PARTS, FOLLOWABLE ONLY (replaces §22.5 Gz2, Gz3; owner: `input/gizmo_rule.ts`, the wiring)
* **Gz0 — WHAT A FACE IS, PER LINE** (kept): a real face at the face's plane or proud of it is the face; a void CLOSED along the line travelled (faces of
  that plane on both sides along it) is crossed; a void inside the face's closed region open along the line — its real floor (D3); a void OPEN AT THE EDGE
  (outside the face's closed region) or beyond the face — **a GAP: no section there** (the owner: *"the red section loop should stop at the edge of the void
  because the void is at the edge"*).
* **Gz1 — THE GIZMO** at the shown place: the real surface along the face's normal (a slot's floor, D3), or straight across a closed void on the face's
  plane. In a GAP **the gizmo waits where it last was on the face** — the orbit tilts on (*"the orbit tilt shall take over"*) — and resumes where the place
  reaches a face again. ⛔ §22's Gz2, the parts' nearest point — DELETED (it was the void-crossing).
* **Gz2 — THE LINES ARE THE TWO PLANES' CUTS OF THE REAL PARTS THROUGH THE GIZMO** (replaces §22's Gz3): the green the dx plane, the red the dy plane, both
  through the gizmo's own place — the gizmo is a vertex of both in every frame (⛔ the notch: the lines cut through the travel's target while the gizmo was
  at the shown place); along each, the real surface by Gz0 at every sample, nothing in a gap.
* **Gz3 — ONLY WHAT THE GIZMO CAN FOLLOW**: each line drawn from the gizmo both ways only as far as the travel can carry it (T3 – T5: R4's stop, an
  unreachable face's edge) — ⛔ the whole loop.
* The gizmo is SHOWN, never moving anything (§22.5's heading, kept).

### 26.5 Deleted (beyond §22.7)
`loop_calm.ts` (the gnomonic profile — its profile functions kept in `loop_view.ts`), `loop_camera.ts` (the cone, the carried up, the up's pace, the
view's hold, the zenith clamp on a direction), the nearest-point gizmo (GJK in the display), the lines as the gizmo's paths, the slider
`cameraRollDegPerS`; `travelStep`'s `allowed` and its cut-back (T5 is a crossing test now).

### 26.6 Build steps and gates
1. `loop_view.ts` — V1 – V5 (engine-free), its vectors RED against `1.0.103-` (absent; the roll on a cap measured).
2. T5 in `loop_travel.ts` as the crossing test; the followable reach (`travelReach`) for the lines.
3. Gz0 – Gz3: the gizmo rule's GAP, the lines from the gizmo's own travel.
4. The wiring; the deletions; `view_reach` on the five shapes.
**The series** (§22.10's 16 runs and gates, unchanged) — plus: a view rolled (the up off the yaw / pitch frame) 0; the ring off a drawn line 0; a drawn
line beyond the gizmo's reach 0.

### 26.7 Build status (2026-11-06, `1.0.104-`, uncommitted) — and what the vectors corrected on the way
✅ Built: `loop_view.ts` (V1 – V5, `sameView`), T5 as the crossing test (`travelStep(…, crossOk)`, `travelReach`), Gz0 – Gz3 (`gizmo_rule.ts`'s GAP, the
gizmo's own place `onContour`, the lines through it, followable only), the wiring, the deletions (26.5). **1618 vectors.** Corrected while building —
each in the rule's owner, none a rule of its own:
* **V3 — the neighbour and the share READ ON THE LOOPS** (`sideAt`): the first build took the neighbour as *the facet whose normal leans most that way* and
  the share from the facet's extents — on a hexagon the wrong neighbour (two tie), on a trapezoid the bisector never reached where the travel crosses. Now
  the face beyond each end of the face's own dx / dy loop through the place, and the place's share of the travel's turn across it (`view_reach`).
* **V3 — a neighbour both loops reach leans ONCE** (at the larger weight): on a slanted edge both loops end at the same face and the view leaned twice as
  far (vectored on the frustum's front / side edge; the summed mutant fails four vectors).
* **V3 — the face's OWN planes, never the travel's**: the travel's planes carry its path (arriving from a top, the cap's) — the same place read two views.
* **V4 — the entry edge's point clamped onto the wall's edge with the cap** (a hexagonal cap: beyond the wall's span the line met its plane past its side).
* **V4 — the entry side read from the entry wall's normal** (the carried axis points to the far edge on a top, to the entry edge on a bottom).
* **T5 AIRTIGHT** (`loop_travel.ts`): a place on an edge read on the neighbour's side is a face change too — the same crossing test (it changed face with
  none: a bottom's side edge onto the side wall, a 118° step); a step starts on the travel's own facet (the nearest side on it); a stop keeps the place
  0.1 mm inside its side; a cut that holds an edge exactly is re-cut 1.5 mm inside the travel's own face.
* **Gz0 — "inside the face" reads the face's plane and what stands proud of it, never a void's floor**: a void open at the edge WITH a floor counted as
  inside (its floor's region) — the gap missed (`void_bridge`).

⚠ **OPEN — the view on SLANTED shapes at their corners** (`view_reach.test.ts`'s search, not asserted): every facet of all five shapes is reached, and the
box (`Scene_1`'s contour) never steps (≤ 8° per 2.5° of turn); but at a few points of the hexagonal prisms, the frustum and the squat pyramid — where three
faces meet with a slanted edge — a face's own dy loop through the place is a few mm long and ends at the slanted neighbour instead of the top / bottom:
the pitch lean jumps there (35 – 80° in one step). Not `Scene_1`'s case (a box); a decision for when a slanted assembly comes (the lean read from the
nearest edge of each kind, or the loops' ends weighted by their length).

**The series on the second rebuild** (16 runs, 27 331 frames, 0 page errors):

| gate | `1924bd4` (s33 / s34) | `1.0.104-` |
|---|---|---|
| upside-down / slanted — walls | 0 / 0 | **0 / 0** |
| upside-down / slanted — tops and bottoms | 0 – 261 / 761 – 2052 | **0 / 0** |
| the up stepping · relocations · touching | 0 · 0 · 0 | **0 · 0 · 0** |
| the ring off a drawn line (> 3 mm) | 0 | ⛔ **220** (red, 14 – 16 mm) — the gizmo on a strip of face narrower than one 12 mm sample: both neighbours gaps, its vertex joined to no segment. Fix: each line's end found at the face's edge (halving between a surface sample and a gap), not at the last sample |
| a section "thrown" | 0 | 418 — the gizmo WAITING in a gap (Gz1) while the travel's place runs on (the analyser compares the plane with the place); then the resume — by the rule; the owner to judge on the device |
| against the finger | 20 – 23 | ⛔ **371** — on a top held at its far edge with the camera straight down, a dx moving the place the other way on the screen; the pure model does not reproduce it (from the front onto a top, dx left moves left at the zenith): in the app the camera's yaw (−42°) does not match the side entered — to be traced with the travel's entry recorded by the probe |
| camera / piece jumps | 33 / 18 | 25 / 12 — the fast dy far out (the headless input in bursts) |
| stalls | holds | T5's edge stops and the lift out from below G1 (A2) only |

### 26.8 The owner's feedback since `1924bd4` — each captured
| when | the owner | where it lives now |
|---|---|---|
| 11-06 | the gizmo stuck on a bottom going up with dy, *"sometimes"* | V4 (no sideways lean on a cap), V2 (no cone, no carried up), 26.3 |
| 11-06 | the red into the void to the protruding edge and back; *"Why did you break my rules ? What other rule conflicts with my rule ?"* | 26.1; Gz0's GAP; Gz2 (plane cuts of the real parts); the nearest point deleted |
| 11-06 | *"You should not display sections which are not followable by the gizmo"* | Gz3 |
| 11-06 | the notch at the start of a dy — *"breaks the rule that the sections shall be planes"* | Gz2 (the lines through the gizmo's own place) |
| 11-06 | *"there shall be a lean only if the next contour face can be reached"* | V3, V4, 26.3 |
| 11-06 | the drawing: pitch (1) and yaw (2) leans allowed, roll (3) never | V1 – V4 |
| 11-06 | *"(i) The heading follows the wall's at the same left/right position"* | V4 |
| 11-06 | *"Rebuild from 8dfa635 making sure you capture all my feedbacks"* | this section + §22.11 (every earlier item, still where it lives unless named above) |
| 11-06 | (the series on the view rule read on the camera's view — built on `1.0.103-`, not committed) | superseded: no cone, no carried up (V2) |

## 27. ⭐⭐⭐ THE TRACK AND THE SHELL; DEPORTED FACES; THE LINES' ENDS (2026-11-06, branch `1.0.104-`, on §26)

> The owner, on `3578bea` (17 attachments): the gizmo stuck while the orbit goes on, then jumping to catch it (att. 1–3, 9, 11, 12, 17); the green section
> switching mid-dx (att. 4–5); the red section a strange contour after crossing onto a face (att. 6–8); the black part's top not a face of its own (att. 10:
> *"we need to define a rule for the faces which are a deport of the contour face (same normal, continuity of edges when projected by the normal to the
> contour face, different depth)"*); the black top and bottom not reachable by dy (att. 13–16) → *"Do not patch these bugs one by one, but analyze the
> common root causes"* → *"I accept the deported-face rule. Proceed with the specifications, the rebuild"*.

### 27.1 The root causes (the analysis the owner asked for)
| root cause | the rules in conflict | the reports |
|---|---|---|
| **RC1 — ONE SURFACE, TWO JOBS**: G1 was both the travel's track and the piece's clearance shell, so it was pushed out to every part's support (`Scene_1`: the top at 0.54 for the real 0.48, the front at −0.09 for −0.05, the front 6 cm wider than its real face) — long strips of track with no real face under them, where the gizmo WAITED (§26 Gz1) | §22.1 G1 at the support (mine, for P1) × the owner's gizmo rule (on the faces, where the piece lands, never hidden) — reconciled first by the nearest point (rejected), then by the wait (it made every strip a stuck gizmo and a jump) | 1–3, 9, 11, 12, 17 (stuck, then a jump); 4 → 5 (the green from the waiting gizmo's old place); 6–8 (the waiting gizmo's planes were the left face's: its red plane parallel to the front — the outline all round it); the series' "thrown" sections |
| **RC2 — A FACE HAD ONE DEPTH** (its largest coplanar group): `Scene_1`'s faces are stepped (the black bars, the parts' tops and bottoms at other depths) — a recessed face was a void: bridged over (the gizmo in the air above it) or a gap (the gizmo waiting) | Gz0's main depth × the real assembly; no rule for a face at another depth that is not a hole | 10, 13–16 (the black top / bottom never landed on — the travel reached the cap: *"onto a cap"*) |
| **RC3 — A LINE ENDED AT ITS LAST SAMPLE** (every 12 mm) | — | the ring 14–16 mm off the red line on a strip narrower than a sample (the series) |

**"Against the finger" at a top's corner — real, not a reversal** (the owner could not reproduce it; replayed in the app with the travel's state recorded,
105 frames): on a top entered from the right wall, at its front-left corner, a finger mostly LEFT and slightly down: the dx is refused at the cap's side edge
(T5 — right), only the small dy moves the place, back toward the entry wall; at that corner the camera's yaw is the right wall's corner yaw (V4, the
owner's (i): 45°), so the cap's dy runs 45° off the screen's vertical — the gizmo slides down-right while the finger pushes left against a held edge. A
consequence of (i) at a cap's corners; noted, not changed.

### 27.2 ⛔ SUPERSEDED BY §29 (the track at the support again; the landing and the rope instead of Gz0) — The rules (replacing §22.1's G1, P1's reading of it, §26.4 Gz0 – Gz2 where they differ)
* **G1 — THE TRACK** (owner: `face_map.ts`): the faces contour with each facet at ITS REAL FACE's plane (its main group — Step 5's, D5's facets): what the
  travel (T1 – T6), the view (V1 – V5), the gizmo and the lines read. ⛔ The track pushed to the parts' support.
* **G1s — THE SHELL** (owner: `face_map.ts`, the facet's `es`): the same facets pushed out to the placed parts' SUPPORT — convex, every part inside. Read by
  ONE rule: **P1, the piece's place** — from the track's place along the view, out to where the shell is left, then the approach's distance (above the
  shell: along the view; below it: toward the gizmo — A1). The orbit still cannot touch a part (P1 kept, no solver).
* **Gz0 — WHAT A FACE IS, PER LINE** (amended with the owner's DEPORTED FACE): at a place of a facet, for the line travelled —
  1. a real face at the face's plane or proud of it → the face (the frontmost real surface along the normal);
  2. **inside the face's closed region** (a hole of the face, enclosed): closed along the line → crossed on the face's plane; open along it → its real floor (D3);
  3. **outside it — a DEPORTED FACE**: a real face of the same normal at another depth whose outline continues the face's outline (not enclosed by the
     face) → the face, at its own depth — the gizmo goes onto it (a jump in depth), the piece stays on the shell (the owner: *"reached with a jump of the
     gizmo while the green piece stays on its offset shell"*);
  4. nothing of that normal under the place (a void open at the edge, beyond the face) → a GAP: no section; the gizmo waits on the face, the orbit tilts on.
  ⚠ A notch reaching the face's edge WITH a face of that normal behind it is a deported face (3), for both lines — no longer a bridge for the line it is
  closed along (`1.0.100-` §18's fixture amended).
* **Gz2 — THE LINES END AT THE FACE's EDGE**: each line's end found where the face ends between a sample on a face and one in a gap (halved to 1 mm) —
  never at the last sample; the gizmo a vertex of both lines in every frame.

### 27.3 Build and gates
The track / shell split in `buildFaceMap` (`e` the real face's plane, `es` the support); P1's place from the shell's exit (`shellExit`); Gz0's deported
face (`gizmoCase`); the lines' ends. The series — the usual 16 runs and §22.10 / §26.6's gates, every report since `8dfa635` checked: upside-down / slanted
(walls, caps), jumps, stuck (the gizmo still while the place moves on a face), slowed, the ring off a line, back-and-forth, sections thrown, the far
faces reachable, the tops and bottoms landed on.

### 27.4 The series on §27 (16 runs, 27 383 frames, 0 page errors) — every report since `8dfa635` checked
| check | `3578bea` (§26) | `9fdb829` (§27) |
|---|---|---|
| upside-down / slanted — walls, tops and bottoms | 0 | **0** |
| the gizmo still while the travel's place moves (runs ≥ 15 frames — att. 1–3, 9, 11, 12, 17) | (not counted) | **0** |
| on a top / a bottom, the gizmo on a real face of it (att. 13–16) | — | **every frame** (95 % within 3 cm of the track's plane; the rest 3 – 6 cm above it on a proud part — the funnel — or below it on a deported face) |
| the ring off a drawn line | 220 | **0** |
| sections "thrown" (a plane beyond the place's motion) | 418 | **50** — dy legs over the top, 21 – 27 mm: the gizmo stepping between depths (a proud part, a deported face); not each traced |
| against the finger | 371 | **302 — all on a top / a bottom held at an edge**: the corner effect of (i) (§27.1) |
| the up stepping · relocations · touching · back-and-forth | 0 | **0** |
| camera / piece jumps | 25 / 12 | 31 / 17 — the fast dy (12 px a frame), the headless input in bursts |
| stalls | — | the edge stops (T5) and the lift out from below the shell (A2) only |

### 27.5 What is left to build, and the rules it meets (checked 2026-11-06)
* ⏳ **Step 8's remainder** (above) — for a non-box assembly; compatible.
* ⏳ **The slide** (`HOVER.md` §0 items 20 – 22: a settle stopped short, wedged under an overhang, stuck in a slot) and ⚠ item 8 (the slide not always
  latching at the end of the approach — unchanged by the rebuild: A1 still goes straight toward the gizmo; its offered fix, straight in along the face's
  normal near the face, would AMEND A1).
* ⏳ **The playability queue** (`QUEUE.md`, paused for `Scene_1`): `3D2` *the approach* was written for the parts' alignment and snap (deleted 2026-11-02)
  — to be rewritten round the orbited piece before it is built; `GM9` the player layer; the hover as a score episode (`HOVER.md` §0 item 7).
* ⚠ **Conflicts to keep in mind**: (1) **D3's slot floor × the slide stuck in a slot** (item 22) — a hole open along the line shows the gizmo on its floor,
  the approach can follow it in; when the slide is worked on, one gives. (2) **The floor as a host** (`HOVER.md` item 5, parked) would contradict *the
  floor is ignored* (§25) if revived. (3) **(i) at a cap's corners** — a top's dy 45° off the screen's vertical there; the rule to change is V4's (i) if it
  is disliked on the device.

## 28. ⭐⭐⭐ THE DEEP DEBUG — LONG WALKS WITH CHANGES OF INPUT DIRECTION (2026-11-06, build `9fdb829`; ⛔ NOTHING BUILT — the owner: *"capture that in the md files, but don't build the fixes. I want to deepen the analysis of the root cause before"*)

> The owner: *"a series of random walks with dx, dy, mix dx + dy, changes of input direction … several orbit tilts each walk, at several distances,
> walking through singularities-corners-protruding parts-recessed faces-slanted faces … We have never tested changes of input directions during long walks
> and this is where I see risk"*. Mid-run, on the device: on the top, the green section blocked between the two black faces' edges and the gizmo stuck on
> dx although the grey parts' tops are coplanar with the black ones (*"same for the red section … whatever the zoom"*); dy down a side, the gizmo jumping
> over the red part's bottom face to near the black part, the red section broken; the green section broken left and right on the front; the red section
> broken on the black face.

### 28.1 The walks (`scripts/probes/orbit_probe.mjs`, `MODE=walk`)
One press per walk, 8000 px of drag, its direction changed mid-drag — each segment another kind (dx / dy / a mix), 3 px a frame (a quarter FAST, 8 px); a
change at a random length (60 – 600 px) or 0 – 11 steps after an EVENT (the travel's face changed; a hold, a crossing, a gap); the pointer kept in the
viewport by a lift and a re-press at the centre. 4 distances (the approach 0 / 150 / 300 / 900) × 4 seeds: **16 walks, 108 651 frames in presses, 880
changes of direction, 0 page errors.** Analysed per change (the 45 frames after it) and input-normalised per frame (each jump against the travel's own step).

### 28.2 What was measured
| check | result |
|---|---|
| the travel's place against the new finger direction after a change | **0** of 880 |
| stuck (the place still, no hold, ≥ 30 frames) · back-and-forth | **0 · 0** |
| ⛔ the gizmo jumping in DEPTH (30 – 99 mm in a frame, the travel moving ~3 mm) | **481 frames** — the red-part report |
| ⛔ the gizmo jumping SIDEWAYS (35 – 135 mm) | **282 frames** — a wait resumed; line samples landing away from the travel's place near the sides |
| ⛔ the gizmo still while the travel moves 45 – 137 mm | **41 runs** (19 walls, 22 caps) — strips with no face |
| the up turning 6 – 15° a frame while the view direction turns < 1° | 355 frames — ✅ **NOT A DEFECT** (§28.3 RC6, withdrawn): looking near straight down / up, a yaw turns the picture about the view; the same dx yaw as on a wall |
| camera / piece 0.5 – 2.5 m in a frame | ⚠ an ARTEFACT: far out (5 m), ~10 fps under four browsers, the input in bursts (one large step, two small) |

⭐ **The changes of direction are not the defect**: every issue above occurs mid-segment too; a change only reaches the bad places more often.

### 28.3 The root causes — FIRST READING (to be deepened before any rule changes)
| | root cause | evidence | the rules in conflict |
|---|---|---|---|
| **RC4** | **A track with ONE plane per face cannot fit stepped faces.** §22 (the outermost part) gave strips with no face under them (the waits); §27 (the face's largest region) puts `Scene_1`'s side walls at INNER faces (x = −0.148 / +0.214, the outer sides ±0.25; `es` 0.2425 / 0.2888): the top's track ends at those planes — the grey blocks' tops unreachable (the top-face report); the front's loops run THROUGH the parts near the sides (samples 10 cm away — the green / red breaks); a 3 cm strip along the front's top (the blocks' tops 0.4985, the real front lower) is a GAP — a wait, then a 131 mm jump | §27.2 G1 (the track at the main group) × the owner's *"every face reachable"* and *"the sections are planes"*; any single convex track either leaves strips or cuts faces off |
| **RC5** | **A section is a DEPTH MAP, not a plane cut.** Every line sample and the gizmo are a cast straight in along the facet's normal (`surfaceAt`): a face PARALLEL to that ray (the red part's bottom seen from the front) is never landed on — the gizmo jumps across it, the line breaks | the 481 depth jumps (some are §27.2 Gz0 3's designed jump onto a deported face — ⏳ not yet split) | §26.4 *"the lines the planes' cuts of the real parts"* × the cast that builds them |
| ~~RC6~~ | ⛔ **WITHDRAWN** (the owner: *"I can't reproduce … I can see no issue on far edges nor at corners"*; re-read on the frames): the 355 "spinning" frames are the dx YAW the view is meant to take (V3 – V4: the yaw follows the entry wall's across its width) seen from near straight above / below (`w0_s11` 455 – 462: on the top, e = 87°, dx −, the yaw 82° → 49° over 7 frames) — looking down, a yaw IS a turn of the picture about the view, which my metric (the up's turn against the view direction's) counted as a spin; per frame it is inflated by the probe's bursty input (a 9° frame, then two of 0°). The 45° dy at a top's corner (§27.1) arises only with the dx held at the cap's side edge and a finger mostly sideways: the small dy left is the only motion — real, too small to be seen. | — |

### 28.4 Proposals — ⛔ NOT ADOPTED; the owner chose instead the shell with a proper cast (§29)
* **For RC4 + RC5 — the gizmo travels ON the real sections.** The green and red sections the TRUE plane cuts of the placed parts (their outer outline in
  each plane); dx moves the gizmo along the green outline, dy along the red, by arc length, at the travel's pace — a step walked along, never jumped;
  faces at every depth on the outline (none cut off), no strips, the gizmo always where the two outlines meet. The void rules map onto it: a void closed
  along the line → a straight segment across it; open at the edge → the outline goes round the edge (the orbit tilts on). The convex shell (G1s) then
  serves only the piece's place and the view. ⚠ It replaces the travel's track (T1 – T2, G1): a rebuild of the travel; the cost to measure is the plane
  cuts per step on the iPhone (cached per plane). ⚠⚠ **ITS TWO NEIGHBOURS WERE BUILT AND DROPPED — this one never was** (the owner asked, 2026-11-06):
  (1) **the carrier on the section's HULL** (`75eb381`, `1.0.85-`, `section_hull.ts`): the gizmo rode the CONVEX HULL of the real cut in the yaw plane —
  the hull bridges grooves and gaps, so the gizmo waited, held, drifted and jumped; deleted at Step 4c-bis (§15) for the face map; (2) **§21 / §22's
  travel on plane cuts of the CONVEX contour** — today's track (§21 item 8 named the difference from (1): exact closed polygons; the real surface only
  offsets the depth — that offset IS RC5's cast). Neither followed the TRUE, non-convex outline. ⛔ What made both convex is the owner's condition at §21:
  *"the contours shall be closed loops and cannot be infinite loops due to throw off by singularities or slanted faces"* — a convex cut is ONE closed
  polygon by construction; the true cut of the parts can be SEVERAL loops (a separate part, an overhang, a slot through), with holes, and must be
  reduced to its outer outline (which loop, which way round) before it is a path. That, and a dx walking up every step's side (the view must not follow
  those turns), are what §28.5 must settle before this is proposed again.
* ~~For RC6~~ — withdrawn with RC6.

### 28.5 To deepen before deciding (open)
1. Split the 481 depth jumps: Gz0 3's designed jumps onto a deported face against RC5's skipped parallel faces — and the parallel faces by part.
2. Split the 282 sideways jumps: a wait resumed (RC4's strips) against a sample landing off the travel's place (RC4's loops through the parts).
3. Map `Scene_1`'s facets: which walls' main groups are inner, and how much of each real face lies beyond its facet's plane (what RC4 cuts off).
4. ~~RC6~~ — withdrawn (the yaw seen from above, §28.3).
5. The true outline as a path: one closed loop from a cut that may give several (parts apart, an overhang, a slot through), holes, the way round; a dx
   walking up a step's side (the gizmo along it, the view not) — and the owner's §21 closed-loop condition met by construction, not by a guard.
6. Replay each of the owner's four mid-run reports in the app with the travel's state (`lt`) — confirm the cause named above for each, not by inference.

## 29. ⭐⭐⭐ THE TRACK IS THE SHELL; THE SECTIONS ARE ROPES; THE GIZMO NEVER WAITS (2026-11-07, branch `1.0.105-`; supersedes §27.2 and §28.4)

> The owner (2026-11-06/07): *"I think the shell: each face at the outermost point can work if the cast from P to G is properly done and we define properly
> what face it is casted on or not casted on. At the end, the gizmo shall indicate to the user where would the piece land with A + dy so a recess or a face
> far behind is still a valid landing point, the movement of the gizmo shall be in line with the delta position inputs … and the green and red sections
> illustrate where the gizmo would be if the dx or dy were continuously followed (they shall be world axis planes and intersect at the gizmo)"* → the four
> points decided: *"1- jump across the bottom segment 2- gizmo is a point, not the piece's footprint 3- nothing to land on: the gizmo shall not wait: it
> shall follow the red or green section even if there is nothing to land. Remember: the red or green sections are like ropes tightened around the
> assembly: if there is a void but the section can cross and continue behind the void then the section shall continue through the void and the gizmo shall
> travel over the void, if the void is at the edge and there is nothing the rope can tighten to, the rope shall round around the edge and not be suspended
> in the void … The gizmo therefore travels the red or green section and never waits (it looks like a bug for the user if the gizmo waits) 4- track's
> corners: no issue if the gizmo jumps slightly from one face to the other face over the edge"* → *"Update the md files. Build"*.

### 29.1 The rules (owner: `input/face_map.ts` G1, `input/rope.ts` R1 – R5; the wiring holds the calls)
* **G1 — THE TRACK IS THE SHELL**: each facet (its normal by D5, as before) at the placed parts' SUPPORT along its normal (the outermost point) — convex,
  closed, every part inside it. The travel (T1 – T6), the view (V1 – V6) and the piece (P1: on the shell, so it leaves it at once; A1) read it. ⛔ §27.2's
  split (the track at the largest flat region — faces cut off, loops through the parts, RC4) and its `es` offset (now equal to `e`).
* **R1 — THE LANDING**: at every place of a loop, a cast straight in along the facet's normal; the first real surface hit — any surface, at any depth (a
  recess, a face far behind) — is where the piece would land with A + dy. A POINT, not the piece's footprint (decision 2). None: a VOID.
* **R2 — A STEP** (a face parallel to the cast — the red part's bottom seen from the front): the rope draws the step along the normal (the landing before →
  its corner at the next landing's depth → the next landing); the gizmo JUMPS across it (decision 1). Found by halving the sample interval (6 times:
  0.19 mm) wherever two landings on one facet differ in depth by more than 2 mm — a slanted face converges, a step does not.
* **R3 — A VOID**: the rope goes STRAIGHT from the last landing before it to the first after it — across the void when the line continues beyond it (the
  gizmo travels over it), ROUND THE EDGE when it is open at the edge (the first landing after is the next face's: the rope wraps the corner, never hangs in
  the air). A void reaching the drawn reach's end looks on along the loop for its landing. ⛔ Gz0's four cases (face / hole / deported / gap), D3's floor
  for an open hole, the bridge on the face's plane — the landing and the rope decide every case.
* **R4 — OVER A TRACK EDGE** the landings are joined as they are; the gizmo may jump slightly from one face to the other (decision 4).
* **R5 — THE GIZMO NEVER WAITS**: it is the point of the rope of the line last travelled at its own place (arc 0), by the rope's length; where the rope
  advances slower than 0.35 of the track's pace (a corner it wraps — zero length for the strip of shell beyond the real face), that length is spread over a
  window round it (≤ 50 mm each side): the gizmo slows there and always moves; outside every window it is exactly the landing at the place.
* **THE LINES** are the two ropes through the gizmo's own place (the planes' common line onto G1, as before), each drawn only as far as the travel
  reaches (T5's edges, R4's stops); the gizmo a vertex of both. ⛔ §27.2 Gz2's line ends halved at a face's edge (no gap left to end at).
* ⚠ **A consequence to judge on the device**: over a void the two ropes need not meet (the green spanning a notch in the air, the red wrapping the notch's
  floor edge) — the gizmo is on the rope it travels, the other line is drawn through it (a short connector). Where both land, they meet exactly.

### 29.2 Build and vectors
`input/rope.ts` (`buildRope`, `ropeAt`, `ropeDrawn`), `face_map.ts` (the facets at the support), the wiring (`landingOf`, `ropesOf`, the gizmo on the rope,
`sectionLinesFrame` from the ropes). Deleted: `input/gizmo_rule.ts` (`gizmoCase`, `mainGroup`), `surfaceAt`, the gizmo's wait, `edgeBetween`, the face
map's `regionContains` / `regionReal` / `closedAlong` and `tests/void_bridge.test.ts`. Vectors: `tests/rope.test.ts` (5 — the step drawn along the normal
and jumped, a void crossed, a void at the edge rounded with the gizmo never waiting, a void past the reach's end, a slope that is no step; four mutants
each RED: no step corner, no window, no look past the reach, a void kept as a gap); `facets` / `rebuild_wiring` / `sway_cast` moved to G1 at the support
and the ropes; **1622 vectors**.

### 29.3 The long walks on §29 (`1.0.105-`, uncommitted; the s44 seeds — 16 walks × 8000 px, 107 140 frames, 881 changes, 0 page errors)
| check | s44 (`9fdb829`, §27) | s45 (§29) |
|---|---|---|
| against the finger after a change · stuck · back-and-forth | 0 · 0 · 0 | **0 · 0 · 0** |
| the gizmo still while the travel moves ≥ 20 mm — walls | 19 runs | **3** |
| — caps | 22 | 32, all in a HELD context (the travel stopped at an edge) |
| the gizmo jumping sideways / in depth (> 15 mm, > 3 × the travel's step) | 282 / 481 | ⛔ **1 172 / 1 304** |
| the gizmo more than 100 mm below the track — front / back · top · sides · bottom | 0 everywhere | ⛔ **0 % · 42 % · 69 % · 70 %** (median 40 · 57 · 244 · 165 mm) |
| frame time (median, four headless browsers) | 99 ms | 104 ms |

⛔⛔ **THE FINDING — R1's "any surface, at any depth" on a shell much wider than the faces.** `Scene_1` is a thin painting (33 mm between its front and back
planes) with parts proud of both (the shell's front at z = −0.092, its back at +0.018: 110 mm deep). On a top or a bottom most of the shell lies OUTSIDE
the painting's real top / bottom, and the cast there goes past the face's edge onto whatever protrudes below / above — a proud part 25 – 48 cm away
(replayed: dy up the front onto the top at x = 0.104 — the top's casts at z < −0.0505 land at y = 0.0155, 48 cm below the top; the gizmo then ran DOWN the
front while the place crossed the top, on the rope's chord between that landing and the top's). The same on the sides (ragged ends 75 mm apart). These are
landings by R1 (and deported faces by the owner's §27 definition — same normal, edges continuous in projection), so R3's void rule never applies there:
the rope does not round the edge, it plunges. ⏳ **The owner's decision**: what may be landed on — a depth limit below the facet's real face (a slider),
the cast restricted to the facet's own face region, or as built.

### 29.4 The sections' shapes on the device's build (`24eadc1`) — the owner: *"the behaviors (gizmo, piece, camera) are very good now. However, the red and green sections are absolutely intricate and violate all the times the rule that they should be planes"*
The probe now records each rope every frame (`rs`: vertices, steps, voids, the deepest landing below the track, the gizmo's distance to each line, the
longest chord) and screenshots (`SHOT_EVERY`, `SHOT_END`). 16 long walks (s46, 108 861 frames) and 4 × 4000 px close in (s47), the ropes dumped and
plotted in their planes:
* Every rope point lies in its plane (within 1 mm) and steps are rare (> 5 in 1 – 4 % of frames) — the planes are right; what breaks them on the screen:
* **M1 — PLUNGES** (the red's 94 % of frames, median 455 mm): on a cap or a side most of the shell is a strip beyond the real face, and R1 lands there on a
  part far below (the bottom row's protrusion 48 cm under the top) — the rope runs down in front of the painting and back: a second line beside the first.
* **M2 — THE OTHER LINE MISSES THE GIZMO** (> 30 mm in 88 % of frames): the gizmo is on the rope it travels, but over a strip there is no landing under the
  place — R3 / R5 put the gizmo on a chord or a corner 50 – 240 mm (median, caps) from the place, while the other line's plane goes through the place:
  the line is joined to the gizmo by a diagonal connector. By face: front / back 39 %, sides 65 %, tops 94 %, bottoms 96 %.
* ⭐ **The root: `Scene_1` is a 33 mm painting with parts proud of it; its shell's top and bottom are 110 mm deep** — under ~70 % of a cap there is nothing
  within reach. A box track cannot be narrower there (RC4 again, in its strip form).
* Measured on a temporary build (reverted): **F1 a depth limit** (a landing more than 80 mm below the track is a void) — plunges 94 % → **0 %**; **F2 both
  lines through the gizmo** (their planes through it, not through the place) — the other line off the gizmo on the front / back 39 % → **4 %**; on the caps
  still 87 – 93 % (the strip). ⏳ The owner's decision on F3 (the caps).

## 30. ⭐⭐⭐ THE RULE SET — D1 – D6 (2026-11-07, branch `1.0.106-` from `d926b88`; the owner: *"write the D1-D6 specifications, then proceed with build (or rebuild if this is required to avoid patching with contradicting rules)"*)
The decisions were taken on two pages: the rule set (artifact `T6SSU3jKxpQYEb4szbBUMN`, section 0) and the four questions (artifact `VzRiV6YqvksPr2BYcnJLZ2`,
each answered *"as recommended"*). This section is the specification; §29's R1 (*"any surface, at any depth"*) and R3's straight chord over a void are
superseded by it.

### 30.1 The fundamental rules (they bind every rule below)
* **F1** The gizmo follows dx and dy: the finger's way, never waits, never goes back.
* **F2** The red and green sections are cuts of the assembly by world-axis planes through the gizmo; they show where dy / dx would take it; both pass through it.
* **F3** The gizmo is where A + dy AIMS (the owner: *"I don't care if the piece is stopped by another part during the A + dy"*).
* **F4** The camera is never upside down — the built edge crossings and tilts are NOT revisited (the owner).
* **F5** The piece never goes into a part (contact allowed). **F6** The piece and camera follow smoothly, the scene the finger's way. **F7** No dead ends.

### 30.2 The decisions
* **D1 — what the finger moves.** The gizmo, along the two sections. ⚠ **Realised as:** the finger still moves the travel's place on the shell with the
  BUILT pace (each face in its share of the turn, T2 – T5 of §22 / §26 unchanged) — the view and the camera read that place, exactly as built (F4: not
  revisited; the camera cannot regress). The gizmo is a function of the place that runs along the section without ever going back or waiting (S2, R5),
  so dx / dy move it along the section at the built pace, not by millimetres of line. The shell is no longer cast from for a landing outside its run (S2).
* **D2 — voids** (the owner's own rules): D2a a void with a path beyond it on the same section is bridged; D2b1 a void at the contour's edge that the
  other section bridges is filled up to and including that section (it reaches the gap's lower lip — Q3 confirmed), the tilt there; D2b2 any other void
  at the contour's edge: the section rounds the last face's edges.
* **D3 — protrusions**: the line climbs over them, the step drawn along the normal, the gizmo jumps it (§29 R2, kept).
* **D4 — the approach**: far out as built (the feel kept); inside the shell straight along the normal to the gizmo — no sideways back-and-forth.
* **D5 — the shell following the piece in**: not needed — nothing is cast from the shell (S1), the lines lie on the real parts.
* **D6 — edges**: the section rounds the outline's corner, the gizmo follows; the view is the place's (D1), so it has nothing to blend.
* **Q1 (c)** a recess at least as wide as the piece is followed at any depth (its floor a landing); a narrower one is bridged. **Q2 (b)** a bridge stays
  at the level it leaves, the step at the far side (jumped). **Q3** confirmed (above). **Q4 (b)** an overhang's underside is a step, drawn and jumped
  (aimed at only from the bottom loop).

### 30.3 The rules as built (owner: `input/section.ts` S1 – S3, `input/rope.ts` R1 – R7; the wiring holds the calls)
* **S1 — THE SECTION, EXACT.** Each placed part is convex: its cut by a section's plane is the convex hull of the crossings of its vertex pairs (exact);
  a cast is the first crossing of a line in the plane with those polygons (exact) — the ropes no longer pick meshes.
* **S2 — EACH FACE OWNS ITS RUN (fixes §29.4 M1, the plunges).** A side of the travel's loop (facet `f`, its corners with the facets before / after)
  owns the part of the section between the section's SUPPORT POINTS in the two corners' bisector directions (`(n_f + n_prev)`, `(n_f + n_next)` —
  extreme points of the cut and of the fill, S3); a place whose coordinate along the side lies outside that run casts nothing: it is a void at the
  contour's edge (R3 rounds). ⭐ The back face's protrusion 48 cm below a top is in the BACK's run, never the top's.
* **S3 — THE FILL (D2b1).** A point of the plane is filled when parts lie on both sides of it along the plane's normal (the other section's way) and
  either the line through it along the horizontal axis of the plane facing the wall (the other section's wall normal) is clear of parts — a void the
  other section bridges (D2a) — or the gap along the normal is narrower than the piece (`w`) — the other section bridges it (Q1c). A cast lands on the
  first of a part or the fill.
* **R1 — a landing** (kept): the first surface (S1 – S3) straight in along the facet's normal, within the run (S2).
* **R2 — a step** (kept, D3, Q4b): drawn along the normal, the gizmo jumps it.
* **R3 — a void at the contour's edge** (kept, D2b2): the rope goes from the last landing to the next face's first — round the edge.
* **R4 — a track edge** (kept).
* **R5 — the gizmo never waits** (kept): the slow windows.
* **R6 — a void with a path beyond (D2a, Q2b)**: bridged LEVEL at the depth of the landing it leaves (outward from the gizmo: the one nearer arc 0), then a
  step along the normal at the far side (the gizmo jumps it). ⛔ §29's straight chord (a slanted line).
* **R7 — a narrow recess (Q1c)**: a dip below the level it leaves that comes back up within less than the piece's width `w` along the run is bridged at
  that level. `w` = the shorter side of the piece's resting face.
* **G — F2**: the other section's plane goes through the GIZMO (⛔ through the place): its loop is cut through the gizmo's projection onto the shell along
  the facet's normal; where the gizmo lies on a surface both ropes meet there exactly; over a void the gizmo is a vertex of both (as built).
* **A1 – A3 — the approach (D4)**: far out the piece is along the view from the GIZMO (⛔ from the place) at the approach's distance; below the shell it is
  on the gizmo's normal line, blended in from the view's line over the first 20 mm; the approach and a drag back out move it along that line only. The
  gizmo does not move during an approach (nothing moves the place). ⚠ The camera's look point is the place's, as built (F4).
* ⚠ **P4 (the slide on what the piece rests on)**: measured again before any change — the §29 probes' "22 mm above the gizmo" was the piece's CENTRE
  (its resting face at contact); the latch reach is 20 mm.

### 30.4 Built (2026-11-07, branch `1.0.106-`) — what changed against §30.3, and why
* **Owners.** `input/section.ts` (S1 – S3: `buildSection`, `sectionCast`, `sectionSupport`, `sectionRuns`, `sectionLanding`, `fillAxis`, `faceWidth`);
  `input/rope.ts` (R6, R7 — `bridgeNarrow`; `ropeAt` gives the gizmo's arc on the rope, `sOn`, where the drawn line holds it); `input/loop_travel.ts`
  (`travelAcross`, below). The wiring holds the calls: the parts' model-pose vertices and ids (`placedParts`), the sections cached by plane, the piece's
  width, a few ropes per line by key. ⛔ Deleted: the mesh cast (`modelCast`, `realAlong`, `castParts`, the scratch ray), `swayRay`, `rayMeetsBox` and
  `st.asmCast` — nothing picks a mesh for a line or the gizmo any more.
* ⭐⭐⭐ **G, as built — BOTH lines through the gizmo** (the first walks, s51: with only the OTHER line moved through the gizmo, a dy on a top over the
  strip BEHIND the painting cut the green through the place — only an overhang (`Piece44`) in that plane — and pulled the gizmo 78 mm sideways; IN FRONT
  of it the green landed on the protrusions 30 – 56 cm below). Each rope keeps the place's own way ALONG it (its arc 0) and takes the coordinate ACROSS
  it from the other line (`travelAcross`: the plane moved through a point along its own normal, the place with it): the travelled line at the place →
  the other line across onto that → the travelled line again across onto the other's: THE GIZMO; the other line drawn through it.
* **S2's tolerance INWARD** (a place nearer a run's end than 0.5 mm is out — ⛔ outward: a cast at a top's very edge passed beside `Piece44`'s tip onto
  `Piece45`, 30 cm below — three vertices, a sliver of plunge).
* ⚠ **Deviations to know.** D1: the gizmo moves along its line at the BUILT pace (the faces' shares of the turn), not by millimetres of line — the
  camera's rules are not touched (F4). R6 / R7 "the level it leaves" is read OUTWARD FROM THE GIZMO (the side nearer arc 0), so a bridge's step moves to
  the other side when the gizmo crosses the void. S3's narrow test uses each part's whole extent along the plane's normal (exact for boxes). The piece's
  width `w` is its resting face's narrowest width (`faceWidth`), for both lines.
* **Measured before the deploy** (headless, the dev server): the gizmo and both lines cost 0.9 ms a frame (p50), 2.3 ms (p90), 4.1 ms (p99) — four
  ropes read a frame, the sections cached by plane. The back-and-forth (the five §30 sequences: up onto a top or a bottom, A + dy, then drags and A + dy
  alternating): each drag 77 – 203 mm sideways → **0 – 5 mm**; A + dy straight down the normal, the piece's centre 22 mm above the gizmo (its resting face
  at contact). Two walks (s52, 4 258 frames): the other line > 30 mm off the gizmo — red 88 % → 0 %, green 88 % → 14 %; the green's landings > 100 mm
  below its shell 1 % (⚠ that measure counts the real ragged ends too — `Scene_1`'s right end is a column 0.44 m lower than the shell's top).
* **Vectors** (1632): `section.test.ts` (11 — S1, S2's run and the plunge refused, S3's fill to the lower lip and the slot by the piece's width,
  `faceWidth`, `travelAcross`), `rope.test.ts` R6 × 2, R7 × 1; `sway_cast.test.ts` rewritten (the model pose, exact); the wiring strings moved
  (`rebuild_wiring`, `assembly_orbit`); the audit's finding-1 vectors deleted with `rayMeetsBox`. Mutants, each RED: R6 off (the chord), R7 off, S2 off
  (any depth), S3 off (no fill), the support without the fill, `travelAcross` projecting along the facet's normal.

## 31. ⭐⭐⭐ (superseded by §32 — its reason) THE GIZMO JUMPS, THE BIJECTION, THE MAPPING TO BUILD (2026-11-07 / 08, branch `1.0.106-Gizmo-jumps`; ⛔ NOTHING BUILT AFTER §30)
**Read this section first in a new conversation.** §30 is live (`e42f982`, the merge of `d26f71a`). The owner tested it: *"the overall behaviors are OK
but there are huge and small jumps of the gizmo and the piece, but not the camera … there are still some red or green sections which are intricate and
which break the rule that they shall be planes."* What followed was analysis and design only. Next: §31.9.

### 31.1 The artifacts (claude.ai, private to the owner) — what each holds
* **The recap and the rules to build — [Gizmo Mapping Rules](https://claude.ai/artifact/WM1tubD7R9Vm8Hkw2a2qcq)**: the layers (what drives what), the
  glossary, the register F1 – F7 / D1 – D13 with each rule's status, a sketch per new rule, the islands decision (D13), the offline measurements, what is
  open. ⭐ The design to build; §31.7 is its text.
* **The decisions and the flaws — [Section Rules: Open Decisions](https://claude.ai/artifact/VzRiV6YqvksPr2BYcnJLZ2)**: (top) the owner's principle's
  one rule to decide (a P with nothing of its face under it: hold / land / stretch, sketched on `Scene_1`'s top) and the added rule *the shell follows
  the piece in*; then *why the gizmo and the piece jump* (J1 – J5, L1, sketched and measured on `e42f982`); then the four questions Q1 – Q4 of §30
  (answered).
* **The logic as built up to §29 — [Orbit Track, Shell and Cast](https://claude.ai/artifact/T6SSU3jKxpQYEb4szbBUMN)**: section 0 the rule set of §30 as
  then proposed; sections 1 – 5 the track / shell / cast of §27 – §29 with their singularities.

### 31.2 §30 measured (the series on `e42f982` — `scripts/probes/run_series.sh`)
32 long walks with changes of direction (16 × 8000 px at four approach distances, 4 × 4000 px close in, then 12 more with the piece sprung). Against
`d926b88` (§29): the gizmo against the finger / stuck / back-and-forth **0** (unchanged); the approach's back-and-forth on a top 77 – 203 mm a drag →
**0 – 5 mm**; the other line > 30 mm off the gizmo 88 % → **3 – 11 %**; the green's plunges → **1 – 2 %**; the gizmo's depth jumps **−80 %**; the camera
**unchanged** (upside-down 0, the view's step p99 6.9° both, its up's spins and its jumps the same — `analyse_camera.mjs`). ⛔ **But** 526 gizmo jumps in
40 300 frames (median 100 mm, max 557 mm), and the piece jumping with them (695 far out against 503 before): §31.3. Every drawn line lies in its world
plane within 0.6 mm in every frame (measured on the mesh drawn — the probe's `lp` field): "not a plane" is a SHAPE inside the plane (L1).

### 31.3 The flaws (`analyse_jumps.mjs` on the probe's `gzs` field; the artifact *Section Rules*, top)
The root, one sentence: **the gizmo is not a function of the place** — every frame it is rebuilt from casts sampled round the moving place, and the
result depends on things that change while the place moves 1 mm.
* **J1 — the order of the two lines** (95 jumps, ≤ 331 mm): the gizmo built "the travelled line at the place → the other across → the travelled
  again"; over a strip one pass does not settle, and the other order settles elsewhere — switching dx ↔ dy with the finger still makes it leap.
* **J2 — reaching out over a void** (32, ≤ 527 mm): nothing under the place → the rope's first landing searched up to half a loop away, the gizmo held
  on it (15 % of frames hold it > 100 mm along the rope from the place, p90 244 mm; the windows spread only 50 mm), then a snap back.
* **J3 — a face crossing re-derives everything** (105, ≤ 432 mm): the new face's frame, both planes and the ropes rebuilt from the new place; nothing
  carries the gizmo across the edge.
* **J4 — the rope rebuilt every frame** (232, median ~100 mm; most of the small jumps): its samples laid from the reach's start, which moves with the
  place — the steps, the windows (R5) and the narrow bridges (R7) flip.
* **J5 — the piece hangs from the gizmo** (§30 A1): J1 – J4 move the piece too. A spring on it (uncommitted, `L.gs`) turned jumps into glides of 20 – 70
  mm a frame — it hides the cause, it does not remove it (close in 89 → 83).
* **L1 — the lines are planes but read otherwise**: rounding chords across the air (R3) to a part standing behind; staircases in depth (> 5 steps in
  34 – 44 % of the red's frames, 4 % before — R2 / R6); a kink where the gizmo is drawn into a line while it sits in the air on a chord (J2).

### 31.4 ⭐⭐⭐ THE BIJECTION — why every gizmo construction since the second rebuild broke
The owner: *"we need to biject the orbit + calm of the camera and piece to the travel of the gizmo in world axis on a surface which has singularities
(overhang, recesses, protrusions). The offset shell is an interface layer in-between the two which softens the impossibility of the full bijection"* —
agreed. *"This reminds me of the texture mapping in blender"* — the exact analogy.
* The finger drives a smooth, sphere-like control (the orbit's yaw / pitch with the calm); the gizmo must travel a non-convex, stepped surface. A map
  both continuous and one-to-one between them **cannot exist** as is: (1) **occlusion** — a straight projection (along the face's normal, the view, any
  fixed direction) cannot reach a recess's floor behind its rim or an overhang's underside: plunges, misses, many-to-one jumps; (2) **topology** — a gap
  or a through-hole makes the outer surface not sphere-like (D2's bridges and fills are that surgery); (3) **sharp edges** — the smooth control must
  squeeze or stretch somewhere. The shell is the in-between layer that CHOOSES where the map bends: orbit → shell is easy and built (the travel, the
  pace, the calm); **shell → surface is the whole problem**.
* ⭐ **The polar orbit had it too** (`1.0.99-Polar-orbit-finalized`, §15 / §17 / §18) — the tilt did not create it. The polar orbit's gizmo was already a
  function of the angles (the core box, a ray along the face's normal onto closed regions, blends at the edges), so it had no J1 / J4; but the same three
  obstacles showed as the edge blends (the real outline ≠ the core box), chords through parts (`Piece3`: the close-in dx stalled 630 frames), the voids'
  rules and the depth steps (D3), the lines broken at steps; 36 blockages, 1.2 % against the finger, 14 reversals (§18). The tilt removed the polar
  orbit's own singularity (the poles: yaw meaningless straight above) and brought the travel's crossings, T5's holds and the caps.
* **The literature** (texture mapping, camera navigation) and the patents found 2026-11-07 (⚠ not a legal opinion; the search was not exhaustive):
  * box / cube projection (Blender's *Box* projection — our casts): plunges, misses, seams — textbook;
  * shrinkwrap / closest point (Blender's *Shrinkwrap*; **HoverCam**, Khan, Komalo, Stam, Fitzmaurice, Kurtenbach, I3D 2005 — a camera orbiting any
    object by its closest point): waits at convex corners, jumps at a recess's middle — ⛔ **Autodesk patents** US 7,042,449 and US 8,044,953 (the
    latter listed expired by Google Patents; the former's status not checked) and the multiscale-navigation US 8,665,259 / 8,665,260 (not checked) —
    avoid;
  * **PolyCube-Maps** (Tarini, Hormann, Cignoni, Montani, SIGGRAPH 2004): the closest analogue (a shell of boxes, the surface mapped onto it) — no
    patent found on the method; building the map is a hard optimisation;
  * **harmonic maps / field lines** (Laplace, classical): continuous; in 2D between two closed curves the well-behaved case; 3D bijectivity not
    guaranteed — ⚠ Pixar holds patents on harmonic COORDINATES for cage deformation (US 8,405,676, US 8,587,584), a different use;
  * the **stretch by shares** (a piecewise-linear reparametrisation, textbook).
* ⭐ **The planar rule reduces it to 2D**: in each section's plane the shell's loop (the place's path) surrounds the plane's cut — one closed curve to map
  onto another.

### 31.5 The design path in the conversation (each step's answer)
1. The owner's principle (a sketch): *P on the shell follows dx / dy; G the projection of P; the green the contour G would draw if dx went on 360°, the
   red the same for dy*. ✅ Adopted as the principle (G a function of P; the lines G's own paths) — it kills J1, J2, J4 by construction and makes F2 true
   by construction. ⚠ Amended: project along the FACE's normal (it lies in both section planes — the lines stay exact planes, independent of the
   camera), not along the piece → P view line (the green would climb 24 – 130 mm on `Scene_1`'s steps with the pitch, change with every camera turn and
   jump at every silhouette).
2. Faces not aligned with the world axes: the planes are built from each face's own frame (the green contains its level way, the red its slope, both its
   normal), so the projection stays in both; on a neighbouring face the cast uses the normal projected into the line's plane (as `section.ts` does).
   Recommended: the face's own frame (the red square to the face), not strict world x / z planes.
3. *P with nothing of its face under it*, measured: a cast straight in from the BOX shell hits nothing at **23 %** of the front / back's area, **59 %**
   of the sides', **61 %** of the top / bottom's (each box face's extent is set by other parts). Choices sketched (hold / land / stretch). The owner:
   *"the shell are two planes: one for the red section and one for the green section, each computed at each pitch and yaw"* — ✅ with a planar shell per
   line (the plane's cut offset in its plane) and the cast along that shell's normal, a hit always exists.
4. The owner: *"the camera and piece shall still orbit, with the calm function you have designed. So you need to map this orbit + calm … to each planar
   shell"* — ✅ correct: the built travel stays the input's only owner; a MAP from it onto each planar shell is needed — driven by the built orbit only,
   continuous, never back / never waiting along a line, agreeing at a switch of line. Rejected: by the view direction (undefined across a face's middle,
   where the calm holds the view square), by the nearest point (never enters a recess wider than the piece).
5. ⭐ **The offline probe** of the two 2D candidates (§31.6) → **the stretch by shares**.
6. The owner's display alternative (a sketch): *with dx the green in full and the red a short segment; with dy the reverse* — it does not change the
   mapping (G still a function of the place along the travelled line; the switch still anchored) but removes the other line's far shape (the chords and
   staircases) and most of its cost → D10.

### 31.6 ⭐ The offline probe of the 2D candidates (`scripts/probes/map2d_probe.mjs scripts/probes/scene1_geom.json` — `Scene_1`'s 40 placed parts on their model pose, the shell's facets, the piece's width 45 mm, dumped by `dump_geometry.js`; ~2 min in node)
121 section planes (57 green horizontal, 53 red x = const, 11 red z = const); the exact cut rasterised at 2 mm; recesses and gaps narrower than the piece
closed (Q1c); the box's loop travelled at 1 mm steps; G by each candidate: **STRETCH** (each box side ↔ its run of the outline between the outline's
supports in the corners' bisectors, by share of length) and **HARMONIC** (u = 1 on the loop, 0 on the parts, SOR; G the end of the field line).

| family (planes) | candidate | planes with a jump > 10 mm | largest jump | longest wait (G within 1 mm) | outline covered |
|---|---|---|---|---|---|
| green (57) | **stretch** | **0** | 1 mm | median 3, max 26 mm | 100 % |
|  | harmonic | 6 | 215 mm | median 22, max 263 mm | ≥ 97 % |
| red front / back (53) | **stretch** | **0** | 1 mm | median 3, max 10 mm | 100 % |
|  | harmonic | 2 | 20 mm | median 23, max 418 mm | ≥ 91 % |
| red sides (11) | **stretch** | **0** | 1 mm | median 18, max 94 mm | 100 % |
|  | harmonic | 4 | 484 mm | median 72, max 396 mm | 100 % |

⛔ The harmonic map is ruled out (jumps at the saddle between islands; field lines crowd onto a thin painting's corners — waits; deep pockets missed).
✅ The stretch is continuous on every plane in one piece. Left to it: **islands** (14 of 121 planes — the overhangs `Piece44` y 0.47 – 0.50 and
`Piece45` y 0.14 – 0.24, two red planes through them, four side planes in the strip in front of the painting: D13), **slow zones** (≤ 94 mm of place
for 1 mm of G at the painting's thin end: D12), the anchoring at a switch (D11). ⚠ Not yet in the model: the fill (D2b1), T5's reach limits, the cost.

### 31.7 ⭐⭐⭐ THE REGISTER — the rules to build (the artifact *Gizmo Mapping Rules* holds the sketches)
**The layers.** The finger moves the PLACE on the shell (the built travel, pace and crossings — T1 – T6, V1 – V5 unchanged); the camera and the piece
read the place as built (the camera always the shell at its outermost); per section plane: the OUTLINE (the exact cut + the fill, gaps / recesses
narrower than the piece closed) → the STRETCH of the place's share onto its run → **G**; the lines from G. The finger never moves G directly.
* **F1** kept — the gizmo follows dx / dy, never back, never waits (its slowest pace D12). **F2 amended** — the travelled line drawn in full is where G
  goes; the other a short segment of its plane's cut through G (D10); both world-level planes through G. **F3 – F7** kept (G where A + dy aims; the
  camera never upside down, the built crossings / tilts / calm untouched; no penetration; smooth; no dead ends).
* **D1 amended** — the place on the shell (built); G = the stretch of the place onto the travelled line's outline: a function of the place (+ the anchor
  set at the last switch), whatever the order of the lines. ⛔ §29's ropes and §30's casts per place (J1 – J4).
* **D2 kept** — D2a a gap with a path beyond bridged; D2b1 a void at the edge the other line bridges filled to the gap's lower lip; D2b2 otherwise the
  outline's corner.
* **D3 amended** — steps and protrusions are part of the outline, followed continuously: G slides along a step face (≤ 3 % of the travel measured)
  instead of jumping it. ⏳ The owner may keep the jump.
* **D4 amended** — far out the piece along the view from the PLACE (built); during A + dy it drifts gradually onto G's normal line from far out down to
  the shell, then straight in along the normal (no sideways back-and-forth); close in **dx and dy orbit the piece at its own depth**, checked against
  the parts (the owner — ⛔ A2: a drag first took the piece back out).
* **D5 new** — the shell follows the piece in: during A + dy the shell face the piece approaches moves in with it down to the contact and re-expands as
  it goes out — the GIZMO's P only; **the camera reads the outermost shell** (the owner: *"I agree"*).
* **D6 amended** — G round the outline's own corner, continuously; the view the place's (⛔ a chord to the next face's first landing).
* **D7 kept** — a recess narrower than the piece bridged (Q1c), as the closing of the cut by half the piece's width; wider followed at any depth.
* **D8 amended** — a bridge is the closing's own shape (straight across at the rims, rounded ends), the same whichever side G is on (⛔ Q2b / R6's
  level + far step).
* **D9 amended** — an overhang's underside is on the outline when its pocket is at least the piece's width (G goes under), else bridged (⛔ Q4b).
* **D10 new** — the display: the travelled line in full, the other a short segment (~ ±40 mm) of its plane's cut through G; they swap at a switch.
* **D11 new** — the anchor: at a switch of line the new line's map is shifted so the current place gives the current G (no jump; a little path
  dependence).
* **D12 new, agreed** (the owner: *"Minimum pace: ok"*) — G never slower than a share of the place's pace (~0.35, a slider); the slack taken from the
  neighbouring stretch of the run, the run's ends kept.
* **D13 ⏳ to decide — islands** (a piece of a plane's cut standing apart by more than the piece's width): (a) skip it on this line; **(b) recommended**
  the rope passes over it (straight bridges out to its outer face and back — the owner's D2a), G continuous, over a bridge G over the air and A + dy
  aiming through; (c) G jumps to it and back.
* Superseded: §29's R1 – R5 (casts per frame, reach-outs, windows), §30's S2 by cast, R6, R7. Kept as the outline's inputs: §30's S1 (the exact cut)
  and S3 (the fill).
* Other owner answers this session: the cast that hits nothing — *"cannot occur"* with the two planar shells (true for an offset of the plane's own cut,
  cast along its normal); *Land* (G takes what the cast hits) — *"I see no issue"*, then superseded by the planar shells and the stretch.

### 31.8 The working tree at hand-over (`1.0.106-Gizmo-jumps`, from `d26f71a`; live `e42f982`)
* ⛔ UNCOMMITTED in `src/render/assembly_wiring.ts`: the piece hung from a SPRUNG gizmo (`L.gs`, `L.gsVel`, snapped after a slide) — measured not to
  help (J5); keep or drop with the build. In `scripts/probes/orbit_probe.mjs`: the `gzs` (the gizmo's line, void, arc, facet, last) and `lp` (each drawn
  line's planarity on the mesh) fields.
* The tools in `scripts/probes/`: `run_series.sh` (the series; `OUTROOT=` a scratch folder), `analyse_walk.mjs` / `analyse_walk2.mjs` (against /
  stuck / back-and-forth / jumps), `analyse_jumps.mjs` (the jumps by cause), `analyse_camera.mjs` (the camera's regression check), `analyse_lines.cjs`
  (the lines' shapes), `map2d_probe.mjs` + `scene1_geom.json` + `dump_geometry.js` (the offline 2D model). The probe's modes: `MODE=walk`, `MODE=seq
  SEQ=…` (drags and A + dy sequences), `LAND_EVERY=px` (the approach simulated in place), `SHOT_EVERY` / `SHOT_END` (screenshots), `AFTER=` (a page
  expression).

### 31.9 Next (in order — nothing to start before D13 is decided)
1. The owner's D13 (islands) and D3 (slide or jump) answers.
2. The offline model extended: the fill (D2b1), D12's minimum pace, D13, T5's reach limits; measured again (jumps, waits, coverage).
3. The build: the outline per plane (cached), the stretch and its runs, the anchor, D10's display, D5's following shell, D4's drift — the rules in
   `src/input/` (engine-free), the wiring holding the calls; the vectors RED against `d26f71a`.
4. The series against `d926b88` and `e42f982` (`run_series.sh`, the five analysers) — the camera unchanged, J1 – J5 gone; then deploy and the device.

## 32. ⭐⭐⭐ CONTINUE FROM HERE — THE CLOSE-IN CHART (2026-11-08, branch `1.0.107-Close-in-atlas`, REBUILT FROM `d926b88`; supersedes §29's ropes, §30, §31.7)
**Read this section first in a new conversation.** The owner, after §31's roadblock (*"As we have hit a roadblock with the bijection, let's step back"*):
*"A- the shell … B- the input dx and dy controls P on the shell, which controls the orbit of the piece and camera, including the calm function, the orbit
tilts … C- we limit the red and green contours and the gizmo only: 1) when the piece is close in … 2) … limited to a small surface locally … aligned with
world axis planes and the gizmo shall be always at the intersection of the green and red and correspond to where the piece would land at the end of the
A + dy approach during close in … If a jump/back-and-forth/etc. would occur within the limited surface, the limited surface shall exclude this singularity
(and the singularity shall be reached by going out of the close in and back in)"* → the answers below → *"i agree with all your recommendations. Prepare the
specifications … rebuild … deploy … random walks (including approaches now)"*. ⭐ The global bijection (§31.4) is not attempted: an ATLAS of local charts,
each one-to-one by construction, one anchored at a time.

### 32.1 The base, and why (no patching of contradicting rules)
* **`d926b88`** (the tip of `1.0.105-`, §29 + the §29.4 probe) — its travel (T1 – T6), view (V1 – V6), calm and tilts, its PIECE ON THE SHELL (P1: the
  piece reads the place, never the gizmo) and its camera are B, which the owner judged *"very good"* (§29.4) and measured 0 against / 0 stuck / 0
  back-and-forth (§29.3). ⛔ Not `e42f982` / `d26f71a` (§30): its A1 hung the piece from the gizmo (J5, §31.3) and its S2 / S3 / R6 / R7 are rules about
  ropes, which C replaces. ⛔ Not `1.0.101-`: its facets sat at each face's main plane (no `supportOf`), not the shell A names (the owner agreed, A).
* Deleted on the branch: §29's ropes (`input/rope.ts`, `tests/rope.test.ts`), the per-place mesh casts (`modelCast`, `castParts`, `realAlong`,
  `landingOf`, `ropesOf`, `gizmoTravel`, `st.asmCast`), and the exports they alone used (`swayRay`, `rayMeetsBox`, `onContour`, `travelReach`).
  Carried from `1.0.106-` (`63a4fee`): the docs (§31) and the probes. ⛔ Not carried: the sprung gizmo (`L.gs`, J5 — the piece no longer reads the gizmo).

### 32.2 The decisions (the owner, 2026-11-08 — each answered in the conversation)
* **A** — the shell is `1.0.105-`'s G1: each facet at the placed parts' outermost point, convex, every part inside it.
* **B** — dx / dy move P on the shell; P drives the piece and the camera (the calm, the tilts) exactly as on `1.0.105-`.
* **C1 — close in is a DISTANCE** (*"distance decides whether there is a gizmo: yes and no … shall be a gizmo at every distance (the waist) … the value of
  the waist has to be deliberately fixed"*): within `closeInMm` (default **120 mm**, a slider in CAMERA ORBIT, left 30 mm further out) of the shell — the
  gizmo, its lines and its area shown, at every distance down to the contact; far out NO gizmo, NO lines (*"Far out there is no gizmo nor red-green
  contours"*). Its own number, not the camera's waist (the view unchanged). ⚠ Corrected in the conversation: on `Scene_1` the approach is monotone, its
  waist **90 mm** from the shell, the far orbit 6 m (the scene's own rig — the 646 mm first quoted was the default rig's).
* **C2 — over nothing to land on, the chart anchors on the facet's nearest accepted landing** (the gizmo appears there; appearing is not a jump) — never no
  gizmo close in, never a refused approach.
* **C3 — what may be landed on is decided by a BOOT PASS, per facet, no slider** (*"a coarse broad pass at boot … retract a margin to be on the safe side"*):
  rerun when the placed set changes.
* **C5 — the patch's edge STOPS the input** (*"the input shall be blocked (and the user shall bring the piece away to reload): … a delimitation of the
  limited area"*); no radius — the patch is the whole continuous region on the facet; the lines short; the outline drawn.
* **The feel** (*"the feel is perfect on the front face of the blue part in branch 1.0.106- … the movement feel i want to maintain"*): on a flat face the
  gizmo is the place carried straight in — the same 1:1 motion as there, the same pace and ease (the travel untouched).

### 32.3 The rules (owner: `input/close_in_chart.ts` K1 – K8, C1, C4 — engine-free; the wiring `render/assembly_wiring.ts` holds the state and the calls)
* **K1 — THE CASTS**: each placed part's convex hull (its half-spaces from its MODEL-pose vertices — `hullPlanes`, `hullParts`), a ray clipped against each
  (`castHulls`; its box first). No Babylon ray, no sway (the vertices are read on the model pose).
* **K2 — THE BOOT PASS** (`facetAccept`): per facet a 10 mm grid cast straight in; the landings connected by steps ≤ 40 mm to the facet's OUTERMOST ones
  are its own; the facet's depth limit = their deepest + 10 mm (the margin). `Scene_1`: ~8 400 casts, ~20 ms in node; the protrusion 48 cm below a top
  (§29.4 M1) is refused.
* **K3 — THE REGION**: a 2.5 mm grid on the facet, filled breadth first from the anchor (600 casts a frame); a neighbour joins when its landing is
  accepted (K2), inside the facet's extent, and within 3 mm of the cell it is reached from — so the region is continuous BY CONSTRUCTION: a step, a void,
  a refused landing, the facet's edge end it (the singularity stays outside). `Scene_1`'s back: 35 600 cells filled in ~100 frames.
* **K4 — A RECESS / GAP NARROWER THAN THE PIECE** (its resting face's narrowest width) is bridged along the way it is met, level to level (the depth
  interpolated between the rims — §30 D7 / Q1c kept); a wall standing up across the way is never bridged; a wider recess ends the region.
* **K5 — THE ANCHOR** (C2): on entering close in, the travel's place on its facet; its own landing if accepted, else the nearest accepted coarse landing
  with the chart SHIFTED so the place gives it (the gizmo moves with the place from there).
* **K6 — THE STOP** (C5): close in, a finger step whose place would leave the region (or the facet) is cut back to the region's edge by halving
  (`allowedShare`); the HUD: *"the edge of the close-in area — bring the piece out (A + dy) and back in to move on"*. A + dy is never stopped by it.
* **K7 — THE LINES**: the green along the facet's `t`, the red along its `b`, through the gizmo, sampled per cell, as far as the region goes, at most
  **±50 mm**; each in its plane `(t, n)` / `(b, n)` through the gizmo EXACTLY (on `Scene_1` world planes), the gizmo a vertex of both.
* **K8 — THE OUTLINE**: the region's border cell by cell at each cell's depth, a light neutral line 1.5 mm off the surface (redrawn while the fill grows),
  white and opaque when the gizmo is within 20 mm of it (the stop is near).
* **The gizmo** = the shown place's chart coordinates, bilinear over the region's corner cells (continuous); faded in over 150 ms when close in is entered.
* **C4 — THE APPROACH LANDS ON THE GIZMO**: close in, the piece's direction turns smoothly from the view (at `closeInMm`) onto the chart's normal (at the
  shell), and its foot from the place onto the shifted place (K5) — at the shell it stands straight above the gizmo, and A + dy goes straight in onto it.
* Unchanged from `d926b88`: T1 – T6, V1 – V6, the calm, P1 (on the shell), P3 (the resting face turned by the facet's normal), A1 – A2 (below the shell a
  drag takes the piece back out; the slide), the camera.

### 32.4 The singularities, and how each is reached (the coverage argument)
A landing by a straight approach must be visible along the approach's direction, so the charts cover exactly the landable surface:

| singularity | inside one chart | reached by |
|---|---|---|
| a step (the depth jumps) | the region stops at its lip | a chart anchored over the other level (out past `closeInMm` + 30 mm, the place moved, in again) |
| a face parallel to the facet's normal (a riser) | never landed on | the neighbouring facet's chart |
| an overhang's underside | hidden | the bottom facet's chart |
| a void / a landing far below (a cap's strip) | the region stops at the rim; K2 refuses the far landing | a chart anchored over a landing (C2 shifts onto the nearest) |
| a recess narrower than the piece | bridged (K4) | — the piece cannot enter it |

### 32.5 Vectors (1627, all passing — MEASURED 2026-11-08)
`tests/close_in_chart.test.ts` (13): the hull's planes and the first part met, a slanted face; K2 the far protrusion refused; K3 the step, the wide slot,
the void and the far part outside the region; K4 the groove bridged level with its rims; the gizmo walked 1 mm at a time never jumping; K7 the lines in
their planes exactly, the gizmo a vertex of both, ±50 mm; K8 the outline on the border only; the singularity reached by another chart (onto the proud
part, into the slot); K5 the shift; C1 the hysteresis; C4 the direction; K6 the share. RED against `d926b88` (no module). ⭐ Mutants, each RED: the step
test removed (4 red), the bridge removed (2), the shift dropped (1), the hysteresis removed (1), the depth limit removed (1), every landing accepted (2).
Moved: `rebuild_wiring` (the chart's wiring), `sway_cast` (the hulls from model-pose vertices — ⛔ as drawn: 3 mm off, near the edge missed),
`assembly_orbit`, `audit_2026_11_04` (no Babylon ray for the gizmo). Deleted with their code: `rope.test` (5), `rayMeetsBox`'s and `swayRay`'s.

### 32.6 Tools
`scripts/probes/chart_probe.ts` (offline on `scene1_geom.json`: a cast ~4.4 µs in node; regions per facet), `orbit_probe.mjs` (`APPROACHES=1`: an
approach as a walk segment, in or out, the landing simulated after it with `LAND_EVERY`; the `ci` field: close in, the chart, its cells, the gizmo shown,
its uv; `ap` the approach), `analyse_closein.mjs` (jumps within a chart, against, waits, the stop, the lines' planarity and the gizmo's distance to them,
the piece / camera steps against the place's, the landing across / along the normal, a gizmo far out), `run_series_closein.sh` (the series).

### 32.7 ⏳ Later — to do
* **THE ATLAS UPDATED WHEN A NEW PART IS SEATED** (the owner, 2026-11-08: *"we need to include a pass update of the atlas when a new part is seated"*). As
  built, a change of the placed set rebuilds everything at once: the shell (G1), every facet's boot pass (K2) and the hulls; an open chart is dropped and
  re-anchored at the next close in. To do: (1) an UPDATE pass when a part is seated — only the facets the new part changes re-cast (the others' accepted
  landings kept), spread over frames like the fill (no stall on the iPhone at the moment of the seat); (2) the open chart refreshed, not dropped, when its
  facet survives (its region re-grown round the gizmo so the gizmo does not vanish under the piece just seated); (3) check that "seated" and the placed
  set agree (`goalLocked`, `lockPlacedPieces`) so a seated part is always in the atlas; (4) vectors: a part seated onto a facet changes that facet's
  landings and region, leaves the others untouched, and keeps the gizmo continuous.

### 32.8 The series on `16b38c4` (2026-11-08 — `run_series_closein.sh`: 12 walks × 6 000 px at four start distances + 4 walks × 4 000 px started close in, approaches mixed into every walk; 78 711 frames, 0 page errors)
| check (`analyse_closein.mjs`) | result |
|---|---|
| a gizmo far out | **0** frames (49 876 close-in frames, gizmo shown in all but 14 — the anchoring frame) |
| the lines' planarity · the gizmo's distance to each line | **0.00 mm** in every frame (max 0.00) · **2.00 mm** (the lift) in every frame |
| the gizmo against the place · waiting while the place moves | **0 · 0** |
| the gizmo "jumping" within a chart (> 15 mm, > 3× the place's step) | 56 — ⚠ all the headless input's bursts: the travel's place moves 65 – 85 mm on one event every third frame and the shown place springs after it; the gizmo moves exactly with the piece (35 / 29 / 10 mm against 36 / 29 / 9) |
| the piece / camera steps | the same bursts (the camera 2 – 3 frames behind the place's step); none with the place still outside an approach |
| the A + dy landing (simulated after every approach in) | across the gizmo's normal: median **0.00 mm**, p95 0.07, max 8.8 (1 of 58); along: the piece's resting point 24 – 77 mm (the piece's own half-depth and its lift) |
| the stop (K6) | 51 of 158 close-in drag segments wholly stopped — each checked at a REAL edge: the front's bottom row, its right edge (the facet's), a column of parts at x = −0.147 (reproduced offline), the bottom cap (its region 8.6 cm² — its parts' steps) |

✅ **FIXED in §32.9** — ⛔⛔ **INHERITED FROM `d926b88` (`1.0.105-`), NOT FROM THE CHART: THE SLIDE'S LATCH LOOP ON A TOP.** A + dy held in onto `Piece4`'s top: the slide
latches (*"on — latched on Piece4's face (1.2 mm)"*), on the next frame the piece stands ~40 mm higher, the slide reads it as *"off — the approach took the
piece away"*, the way out re-derives the approach from the piece's height (0.428 → 0.4615, above the shell) and the approach comes in again — every 10
frames for as long as A + dy is held (18 reversals on seed 22; the same seed on `d926b88` in a worktree: **12**, the same verdicts). ⭐ Found only now
because the walks include approaches. ⛔ A first reading (the drag's coast fighting the approach below the shell, `approachInput` stopping the coast) was
built, measured — the same 18 reversals — and REVERTED (measure or revert). ⏳ To diagnose: what moves the piece 40 mm at the latch (`hoverStart`'s settle /
`applyHoverModel` against `offsetAt`'s offset from `L.p` while the slide holds the centre) — `HOVER.md` §0's slide, not §32.

### 32.9 ✅ The slide's latch loop FIXED (2026-11-08 — the owner: *"Fix 1. I will test the second issue first"*)
* **Diagnosed** (the probe's per-frame `XPRE` hook, seed 22): at the latch the piece's resting point is 1.2 mm above `Piece4`'s top (y 498.5 mm), the
  shell 40 mm higher (539.8). Under the slide `assemblyFrame` set `st.asmGizmoAt` to the orbit's centre — the SHELL's place — and below the shell the
  piece's offset aims at the gizmo (`offsetAt`, A1): the next frame the piece stood ON THE SHELL (539.8), the slide read 41 mm off its face as *"taken
  away"* and let go, the way out re-derived the approach from that height (+20.6 mm, above the shell), A + dy brought it in, it latched again — every 10
  frames. It bites wherever the landed face lies deeper than the latch's reach (20 mm) below the shell (stepped tops, recesses); level with the shell the
  gizmo and the centre coincide (why it was unseen; the earlier walks had no approaches).
* **The rule**: under the slide the gizmo RIDES THE SLIDE at its offset from the centre at the latch (`L.slideG`, set on the slide's first frame, cleared
  when it ends); the piece's below-shell offset keeps aiming at the real face. `render/assembly_wiring.ts`'s slide branch.
* **Measured** (4 walks × 6 000 px with approaches): approach-in reversals on seed 22 **18 → 0**, latch / drop cycles **9 → 0** (one latch held; its one
  release during an approach OUT, as it should); the other seeds 0 before and after; close in unchanged (the lines 0.00 mm, the gizmo on both, the landing
  0.03 mm across, no gizmo far out, 0 page errors). A prototype measured first, reverted, then built.
* **Vectors** 1627 (`rebuild_wiring`: the gizmo at the centre + the latch's offset, the centre itself refused, the offset cleared off the slide) — RED on
  `1cd3fe3`.
* ⏳ **Issue 2, the owner tests it first**: C4's turn of the piece's direction onto the facet's normal over the last 120 mm sweeps the piece 40 – 65 mm
  sideways per approach event at a face's edge (the view up to ~45° off the normal — 2 approaches in the walks; the same with and without the fix).
  Proposed, not built: spread the turn so the piece never moves sideways faster than it comes in (≤ 1 mm per mm — on a 45° edge from ~360 mm out).

### 32.10 ✅ THE RING — cast at the crossing, fixed, the area inside it (2026-11-08)
* **The owner** (on `dac0397`): *"The way the limited area is displayed is very strange: it is a 45degree-tilted square which grows by jumps over a couple
  of frames … I was expecting a ring which directly shows up and encompasses the limited area when the piece crosses the offset"* → *"the ring shall be
  always the same radius (slider to be added) … unless the limited area is smaller than what the ring usually covers"* → *"the ring is cast when the piece
  crosses the offset and is then fixed (until the piece goes back away). The gizmo and red/green sections (and therefore inputs) are constrained within
  that ring"*.
* ⛔ What it was: the region flooded breadth first from the anchor (4-neighbours — a diamond), 600 casts a frame, its cell-edge outline redrawn every 12
  frames while it grew.
* **R1 — THE RING**: cast when close in is entered, centred on the gizmo then (the place + the shift, K5), radius `closeInRingMm` (**60 mm**, a slider in
  CAMERA ORBIT), FIXED until close in is left. **The close-in area is the region INSIDE the ring**: the flood stays in it (a bridge never leaves it),
  `chartAllows` refuses beyond it — the gizmo, the lines (K7) and the stop (K6) end at the ring; where the region is smaller, its own border.
* **R2 — DRAWN** (`chartRing`): marching squares over `min(R − distance, ±half a cell)` — the circle interpolated exactly, the region's border on its
  cells' edges, each point at the inside cell's depth, one Chaikin pass; one updatable mesh, drawn once its area is whole; brighter within 20 mm of its
  border; hidden far out and under the slide (with the gizmo and the lines).
* **R3 — THE ATLAS** (`facetGrid`, `fillGrid`): after the boot pass every facet's 2.5 mm grid cast in the background, 600 casts a frame, the facet the place
  is on first; a chart anchored on it (its origin snapped to the grid) floods the cached landings with no cast — whole in the frame close in is entered.
  `Scene_1`: all six facets cast within ~45 frames of the boot.
* **Measured** (4 walks with approaches, 0 page errors): the ring shown in the frame the gizmo appears in 7 of 8 entries (2 frames later in the 8th, the
  atlas not yet cast there); the gizmo never outside the ring (≤ 60 mm from its centre); the lines 0.00 mm, the gizmo on both, the landing 0.00 mm across.
* **Vectors** (+2, 1629): the ring a circle of the radius in an open face, cut flat at the region's border, the region's own border when smaller; the atlas
  flooded with 0 casts, the same region; the area constrained by the fixed ring (allows, the flood, the lines, the drawn ring the anchor's circle).
  Mutants, each RED: the radius ignored, the atlas unread, no interpolation, `chartAllows` without the ring, the flood without the ring. ⛔ Deleted:
  `chartOutline` (the cell edges).

### 32.11 ✅ NO SPRING ON THE ORBIT (2026-11-08 — the owner: *"i don't like the way the piece movement springs during the orbit. I don't know if the camera has the same spring. Now that the gizmo is not used for orbit, i think a spring is unwarranted. There was no such spring in the finalized polar orbit movement and i want the same feeling"*)
* **Measured** (`MODE=const`, dx / dy legs and reversals): the shown place and view on V6's critically damped spring (`orbitSpringMs` 30 ms) trailed the
  travel **40 – 50 mm** while moving and caught up **~200 ms** after the finger stopped — a rubber band; no overshoot (0 frames moving away from the
  travel). The camera has no lag of its own (`cameraFollowMs` 0, as in the polar orbit) but reads the same shown view: the same spring. The polar orbit's
  piece followed a FIRST-order ease of its gizmo (45 ms) — no such lag at speed.
* **V6 amended**: around the assembly the shown place and view ARE the travel's, at once — the piece and the camera with them. Measured: **0.0 mm** behind
  while moving, still with the finger. Kept: the coast after the release (the orbit's inertia, ~12 mm — the polar orbit had it).
* ⚠ The cost: on the slow tablet (pointer events 47 – 68 ms apart, every 3 – 4 frames) the piece steps per event; the iPhone dispatches every frame.
* `springPoint` deleted (no caller); `orbitSpringMs` still drives the other orbits' spring (`springOrbit`). Vector: `orbit_lag` (no spring around the
  assembly).
