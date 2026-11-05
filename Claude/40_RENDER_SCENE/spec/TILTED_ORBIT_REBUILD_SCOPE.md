# THE TILTED ORBIT — REBUILD SCOPE (from `ff2fca2`)

> **Status** · approved by the owner 2026-11-04 (*"proceed"*) · branch `1.0.93from1.0.87-` (renamed `1.0.93from1.0.87-Polar-orbit-improved`; Step 4 on `1.0.94-`, renamed `1.0.94-Polar-orbit-Red-section-fixed`; Step 4b on `1.0.95-`, renamed `1.0.95-Step4c-of-polar-orbit-built`; Step 4c-bis on `1.0.96-Step4c-bis-of-polar-orbit`) · ✅ **Step 0 built** (2026-11-04, §8) · ✅ **Step 1 built**
> (2026-11-04, §9) · ✅ **Step 2 built** (2026-11-04, §10) · ✅ **Step 3 built** (§11) · ✅ **Step 4 built** (§12) · ✅ **Step 4b built** — dx synchronized with the orbit, and the calm (58d86ff) ported (§13) · ✅ **Step 4c built** — the side decides, the parts read at rest (§14) · ✅ **Step 4c-bis built** — THE FACE MAP: the gizmo a
> function of the orbit's angles, the carrier deleted (§15) · ✅ **Step 5 built** (2026-11-05, branch `1.0.99-`) — the face map on the FACES CONTOUR, D3's real depth,
> D5's two sliders (§17) — ⛔ no device close on any; the half roll moved to the far edge (Q6, §4.1). ⭐⭐⭐ **THE NEXT STEPS REWRITTEN for THE FACET FRAMES** (2026-11-04, the
> owner — §5 Steps 5–8, §16): the orbit's frame turned at every crossing by the dihedral between the faces. ✅ D2–D5 and I1 decided
> (2026-11-04, §16.1): Step 5 may be built — ✅ built (§17). **Next: Step 6.**
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

**Step 6 — The frame turn at a crossing: up onto a top, down onto a bottom.** At a top / bottom edge's threshold the orbit's frame TURNS about the edge by
the dihedral (90° on a box): the top becomes a face of the new frame, orbited as a vertical face is — a dx along the edge, a dy across the top toward the
far edge, the sections the facet frame's planes (I1: on a box the world's x / z lines). The turn RE-BASES with nothing moving: the piece's direction is the
same vector read in the new frame's angles (the spring, the lag, the leash re-read), the gizmo's place taken over by `mapAngles` / `syncAngle` (as after
the slide — no jump). The camera ROLL owed at the turn is the orbit's heading off the edge's normal (none when square to the edge, at most half a slice),
taken over the input's travel, the piece waiting (§4.1's rule). A margin against a finger dithering on the threshold (no turn back before it is passed
back by a few degrees). The finger's axes LATCHED for a drag (and its coast), each a whole screen axis (§6). **Still clamped**: on the top the dy stops at
the far edge and the dx at the side edges (no second crossing, no half / quarter roll yet). ⭐ **The bottom a face to orbit as the others** (D2, the
owner: *"remember that the floor can be crossed by the camera and is invisible from below"*): reached and orbited exactly as the top — the piece and the
camera under the floor's top; ⚠ checked here: the play volume and the solver's contacts never stop the orbited piece's orbit there. Gate: I1–I6 on a top reached at
several headings, the clamp the only stop; a dy back down the edge turns the frame back with nothing moving.

**Step 7 — Crossing on, every edge the same rule.** Open the clamps: over a top's FAR edge (the frame turns again; the camera's half roll there, §4.1;
the input reversed after it, §4.2 — the same finger held at the edge, the reversed one goes on down the far side) and over a top's SIDE edge onto a wall
(the quarter roll, §4.3, the piece waiting); on a non-box contour each crossing turns by its own dihedral, the roll owed the one that brings the camera's
up back to the world's where I6 asks it — ⭐ on EVERY facet that is not purely horizontal, gravity onto the screen's vertical whatever the path (§4.5, the
owner: a walk round a horizontal hexagonal prism's faces must not leave its hexagonal end upside down). Round a VERTEX the frame comes back turned by the vertex's angle defect (90° at a box's corner, a diagonal path):
the frame snapped to the facet's own axes on entering it, the roll owed taken in that crossing. Gate: a constant dy loops the vertical section (stopped
only by the far edge's roll); a constant dx started on a top loops its section (stopped only by the side edge's roll); I1 throughout; the hexagonal prism
looped both ways in the vectors; ⭐ a long walk round the prism's rectangle faces, then onto its hexagonal end: the scene upside up there (§4.5).

**Step 8 — What the faces contour misses; the shell on the facets.** ⚠ (2026-11-04) See also the SLIDE wedged under an overhang (`HOVER.md` §0, item 21) —
a future improvement of the slide, not of the orbit; a candidate gate here: *no slide ends where no way out is free*. What the facet frames' face map does
not reach or reads wrongly (A5): a face more than the merge angle off every facet (`MAP_AXIS_DEG` today); a face no facet's ray reaches (an undercut, the
inside of a U — the orbit goes round the convex outline, the ray lands in a pocket only where it opens toward a facet); an outline narrower at a height
than its facet (the gizmo in the facet's plane beside the real face, no part there); a ray from below on an overhang's underside (D2); two regions
competing for a facet's main plane. ⛔ (`shadowBridgeMm`, `shadowStepMm`, R3, R4 belonged to the deleted hull.) And THE SHELL on the facets: today the
parts' BOX offset (Step 2) — round a hexagon the piece would ride a box's corner past the slanted facets; the offset of the faces contour instead, when a
non-box assembly exists. Gate: I1–I4 across `Scene_1`'s protrusions and the prism's; the gizmo's DEPTH steps accepted (the shell, Step 2).

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

## 17. Step 5 — THE FACES CONTOUR: the face map on facets — built (2026-11-05, branch `1.0.99-`)

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
