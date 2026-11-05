# THE TILTED ORBIT — REBUILD SCOPE (from `ff2fca2`)

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
| **I3** | **No change of direction under a constant input.** The same dx (dy) held forever keeps the gizmo going the same way round the SAME section loop — over and over — unless stopped by (a) a camera roll (then the reversed input goes on, §4) or (b) a discontinuity of that section's own contour. | the constant-input probe: no REVERSE, no STUCK but (a) / (b), no section change |
| **I4** | **The finger drives the orbit, and the gizmo, the piece and the camera all follow from it** (⭐ reworded 2026-11-04, §16 A1 — since Step 4c-bis the gizmo is a function of the orbit's state, no longer its driver) — the piece and the camera never go one way while the gizmo goes the other, nor on while it is held. | both probes: the piece's direction vs the gizmo's face |
| **I5** | **The gizmo goes the finger's way on the screen** — dx right, the gizmo right; dy down, the gizmo down (the owner, Q1: *"same direction as the input wins"* — over the 2026-10-04 inversion if it still stands at `ff2fca2`). | the probe: the gizmo's screen step · the finger's |
| **I6** | **The camera upright** (the screen's up the world's) everywhere but where §4 says a roll is owed. | the random-travel probe: the up within 5° of the vertical on a wall |

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

## 21. THE SECTIONS AS PLANE CUTS — the gizmo travels on them (approved design 2026-11-05; ⛔ the first build FAILED and was reverted — §21.5; to be rebuilt)

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

### 21.5 The first build — its travel series FAILED; committed, then REVERTED (2026-11-05, branch `1.0.101-`); the owner's decisions for the rebuild

> The owner: *"F1: if the delta position would drive the gizmo in an opposite direction, hold the input as I previously specified and this overrules
> anything else. F3: as you recommend. don't patch. update the md files to capture the issues, commit what you have built now, then revert while keeping
> the captured issues, then re-build §21 properly to avoid patching the fixes."*

**What the first build was.** The plane cuts (`input/plane_cut.ts`: closed loops, the 1 mm rule), the screen roles (`input/input_roles.ts`), the camera's
up from the place (`input/camera_up.ts` `placeUp`: gravity on a wall, the carried axis on a cap, rolled over `cameraRollMm` near a cap ↔ wall edge) and
the slider *camera roll at a top's / bottom's edge* (`cameraRollMm`, 10 mm) — ⛔ but **the travel was NOT moved onto the loops**: the orbit's angles, the
face map's columns and the frame turned at every crossing (`frameStep` at the bound + 3°) were kept, the plane cuts only DRAWN (items 3, 7, 8 not built).
1658 vectors green. Committed for the record, then reverted (the docs kept).

**The travel series** (21 runs — the 13-run matrix and the off-square set; `an9.mjs`: the up and camera steps against their neighbours, the gizmo's motion
on the screen against the finger, the tilt by place; checked on three earlier builds first):

| | before Step 6 | Step 6 | the redesign | **§21, first build** |
|---|---|---|---|---|
| the gizmo against the finger (frames) | 39 | 28 | 93 | **680** |
| the camera's up jumping (> 8° a frame) | 2 | 9 | 195 | **1486** |
| camera jumps | 5 | 30 | 7 | 13 |
| blocked / back-and-forth | 36 / 11 | — | 26 / 28 | **51 / 95** (one stuck 940 frames) |
| upside-down views (frames) | 0 | ~15 800 | 559 | ~3 200 (most on the caps) |

**The root causes — ONE common flaw: a crossing was decided THREE times, from three different measures, none of them the loop the finger travels** (the
roll by the nearest edge of any kind; the frame turn by the angle beyond the bound; the roles by the screen, every frame):
1. **The roll's band read the NEAREST edge, not the travel's.** `Scene_1`'s top is ~7 cm deep: the gizmo is always within mm of a SIDE edge, so a dy over
   the top fired a quarter roll onto an edge it never crossed (`q_cm` 1155: the axis +z, the view tilted 93–117°).
2. **On a cap the view passes the zenith MID-CAP, the half roll waited for the far edge**: from the middle to the far edge the scene upside down (`q_cm`
   1111–1131: 91° → 158°). Gravity's sense on the screen is the VIEW's, not the gizmo's place.
3. **The roll spread over the GIZMO's millimetres**: a drag moves it 10–20 mm a frame, so the 10 mm half roll was a step of one or two frames — the 1486 up
   jumps (`q_cf` 1049 → 1051: ~100° in a frame).
4. **The far edge decided out of order**: the frame turned onto the far wall (the angle) before the roll was committed (the place); there, gravity's up made
   dy up CLIMB, the roles read again sent the gizmo back — a dip onto the far wall and two turns per bounce (most of the 95 back-and-forths, the 125
   turns; ~410 of the 680 against-the-finger frames on a cap mid-roll).
5. **R4's stop could DEADLOCK**: it tested the gizmo's next step on the screen; at an edge whose next face is seen edge-on that step points into the screen
   → stopped; nothing moving, the camera never turned to show the face (`q_cc` 1441, dx right on the top's side edge: 940 frames).

**The rebuild — the owner's decisions (2026-11-05):**
* **F1 — ONE CROSSING EVENT, on the loop travelled.** The gizmo's place is its ARC LENGTH along the loop it travels (item 3 as written, at last); an edge
  counts only where THAT loop crosses it (cause 1). At a crossing, once, in this order: the next face's view (tilt, and the roll R3 requires) → the roles
  read for that face (F4) → R4. ⭐⭐⭐ **R4 OVERRULES EVERYTHING** (the owner): if the finger's input would now drive the gizmo the OPPOSITE way along its
  loop, the input is HELD — the gizmo waits at the edge — until the finger reverses or the other input moves it the finger's way. ⛔ No reflection: at a
  cap's far edge, after the half roll, dy kept up is held (⛔ 21.4's *"dy kept up sends the gizmo back along its previous track"* and §20.1's back-and-forth
  loop over the top are SUPERSEDED); dy down goes on down the far wall. A new drag has no direction to oppose. No frame turned by an angle (cause 4).
* **F2 — THE ROLL PACED BY THE CAMERA, not the gizmo**: the crossing starts it, the camera takes it over its own motion, capped in degrees a frame — a fast
  finger cannot make it a step (cause 3). `cameraRollMm` sets where it starts.
* **F3 — THE CAMERA SQUARE TO A CAP** (the owner: *"as you recommend"*): over a top / a bottom the view passes the zenith at the far edge, where the half roll
  is — R2 and the far-edge roll agree by construction; the orbit's tilt (the calm) taken on the walls and at the edges (cause 2).
* **F4 — THE ROLES PER FACE, not per frame**: each face's dx / dy from the loop's direction on THAT face, seen by its upright (or carried) view; read again
  only at a crossing (F1's order). R4 compares against the face the gizmo is on — never a step into a face seen edge-on (cause 5).
* They REPLACE the band latch, the nearest-edge rule, the angle-driven frame turn and the per-frame screen read — none added over them.

### 21.6 The rebuild (v2) — built on F1–F4; its travel series; two regressions; F5 and F6 (2026-11-05, branch `1.0.101-`; the owner: *"do all"*)

**What v2 is.** The orbit's angles and the face map kept (the frame turned at every crossing); on them, F1–F4 as decided:
* **F1 — one crossing event**: the finger's step SPLIT at the first bound on its way (`stepToBoundary`, `input/orbit_frame.ts`), and there, once: the frame
  turned at the TARGET exactly at the bound (`frameStep`, strict — the 3° margin deleted), the new face's roles read, R4 (`holdAtCrossing`,
  `throughHold`, `input/input_roles.ts`: a component driven the opposite way or onto the other axis HELD until the finger reverses it). A crossing
  everything holds is not completed: the target stays on the face it came from. The coast splits the same way (`asmAxesTravel`), without roles.
* **F2 — the up a TARGET, paced by the camera** (`input/camera_up.ts`): a wall's gravity (near the vertical, the wall's own up carried by the view's tilt —
  never the side the view leans); a cap's AXIS, the wall's up turned over the edge crossed (`capAxis`); the shown up turned toward it at most
  `cameraRollDegPerS` (a new slider, 360 °/s) — `paceUp`. Within `cameraRollMm` of the next face on the finger's way, that face's up (the roll starts).
* **F3 — the camera square to a cap**: the calm's shares 0 on a cap; on a wall toward a cap's edge they rise past 1 to the share showing the cap's normal at
  the edge (`capEdgeEnd`, `edgeShareTo`, `input/orbit_calm.ts`).
* **F4 — the roles per face** (`travelFace`): read square to the face with the up the camera turns to; a role change is an R4 event like a crossing.

**Its travel series** (the same 21 runs; `an9.mjs`):

| | before Step 6 | the redesign | §21 v1 | **§21 v2** |
|---|---|---|---|---|
| the gizmo against the finger (frames) | 39 | 93 | 680 | **33** |
| back-and-forth | 11 | 28 | 95 | **11** |
| the up jumping (> 8° and > 450 °/s) | 0 | 31 | 741 | **20** |
| upside-down / tilted frames | 0 / 0 | 559 / 949 | 3256 / 8262 | **11 / 34** |
| camera jumps | 5 | 7 | 13 | ⛔ **104** |
| blocked stretches | 36 | 26 | 51 | ⛔ **110** (the longest ~950 frames) |

The owner's walk works: up the front, the tilt over the top, straight above at the far edge, the half roll there, dy kept up held. ⛔ Two regressions:

1. **STALLS — R4 held by its own anticipation** (`w_hf@2805`, 964 frames, and the other longest): the anticipated roll near an edge read the way the finger
   LAST travelled (`st.asmTravelDir`); a dy that had brought the gizmo near the far edge, then a dx — the direction changed, the anticipation dropped, the
   camera rolled back, the roles flipped, and the flip, an R4 event, HELD the dx; the finger never reversing, stuck. **Root cause: the roles depended on the
   direction, the hold on the roles** — the three-measures shape of §21.5 again (a crossing's view decided from a direction, not from the place).
2. **PIECE JUMPS far out, up to 3.3 m, at a frame turn or a face change near a corner** (28; `w_sqf@2216`): the calm is two SHARES multiplying the orbit's
   angles about the current face's normal. F3's lean toward a cap cannot be re-expressed about another face whose own angle is near zero (a corner: three
   faces) — multiplication cannot make an offset from nothing; `sharesShowing` at each face change kept one direction and not its lagging neighbours.
   Before F3 the shares were 1 at every edge, which hid it. **Root cause: the piece's direction a function of the ANGLES and a per-face state, not of the
   place.**

Not v2's: 33 blockages the slide's own stop (*"at the edge of the hosting faces"*), ~44 small camera-only jumps (40–170 mm, the piece still — in the earlier
builds too), ~15 jumps in the slide.

**The fixes (the owner: *"do all"*) — each replacing, nothing added over:**
* **F5 — THE PIECE'S DIRECTION FROM THE PLACE** (item 6 at last): a field over the faces contour — each facet's normal weighted by the place's distance to its
  polygon (1 on it, falling to 0 over its edge zone), summed: a face's normal in its middle, the bisector on an edge, the three normals' sum at a corner —
  the same from every side, so continuous by construction; the orbit's own direction mixed in by the interior shares (the calm's sliders, a cap's 0 — F3);
  read at any angles from the map's place (no cast), so the solver, the camera and the drawn piece read one function. ⛔ The shares' state, their eases,
  `sharesShowing`, the re-expression at a turn or a face change, the pole fade — deleted.
* **F6 — THE ROLL MARKED ON THE PLACE**: entering an edge's `cameraRollMm` band moving toward it MARKS the face as rolled for that edge; the mark stays while
  the place is in that band whatever the input, and clears only when the place leaves the band by distance (or the face changes). The camera's up and the
  roles read the mark — never the last step's direction. ⛔ The per-frame anticipation along `asmTravelDir` — replaced.
