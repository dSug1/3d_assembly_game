# THE TILTED ORBIT — REBUILD SCOPE (from `ff2fca2`)

> **Status** · approved by the owner 2026-11-04 (*"proceed"*) · branch `1.0.93from1.0.87-` (renamed `1.0.93from1.0.87-Polar-orbit-improved`; Step 4 on `1.0.94-`) · ✅ **Step 0 built** (2026-11-04, §8) · ✅ **Step 1 built**
> (2026-11-04, §9) · ✅ **Step 2 built** (2026-11-04, §10) · ✅ **Step 3 built** (§11) · ✅ **Step 4 built** (§12) — ⛔ no device close on any; the half roll moved
> to the far edge (Q6, §4.1). Step 5 next.
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
   calm's strength depends on the distance (§5 Step 9).
4. **The shell offset**: the piece and the camera ride a smooth SHELL round the assembly; the gizmo stays on the real surface — bumps and holes of the section
   contours (protrusions, gaps, notches under the offset) move the gizmo, never the piece nor the camera.

## 2. The invariants — hold at EVERY step (each step is refused if one breaks)

| | Invariant | Measured by |
|---|---|---|
| **I1** | **The sections are planes, horizontal or vertical — the world's.** The green (dx) and red (dy) lines lie each in ONE plane of the world (`x = c`, `y = c` or `z = c`), drawn through the gizmo. | the constant-input probe: the gizmo within 3 mm of the leg's plane |
| **I2** | **No jumps** — of the piece, the camera, the gizmo's ring, the look point. A step never more than ~2.5× its neighbours' (smooth input). A step in the assembly's depth may move the GIZMO (a break), never the piece nor the camera (the shell, §1.4). | the random-travel probe |
| **I3** | **No change of direction under a constant input.** The same dx (dy) held forever keeps the gizmo going the same way round the SAME section loop — over and over — unless stopped by (a) a camera roll (then the reversed input goes on, §4) or (b) a discontinuity of that section's own contour. | the constant-input probe: no REVERSE, no STUCK but (a) / (b), no section change |
| **I4** | **The finger drives the gizmo, the gizmo drives the orbit** of the piece and the camera — the piece and the camera never go one way while the gizmo goes the other, nor on while it is held. | both probes: the piece's direction vs the gizmo's face |
| **I5** | **The gizmo goes the finger's way on the screen** — dx right, the gizmo right; dy down, the gizmo down (the owner, Q1: *"same direction as the input wins"* — over the 2026-10-04 inversion if it still stands at `ff2fca2`). | the probe: the gizmo's screen step · the finger's |
| **I6** | **The camera upright** (the screen's up the world's) everywhere but where §4 says a roll is owed. | the random-travel probe: the up within 5° of the vertical on a wall |

**Every step lands with**: its golden vectors (shown RED against the step before), both probes run far out AND close in AND after random lead-ins, the
numbers recorded in its dossier, and the owner's device look (rule 5). A step that breaks an invariant is reverted, not patched.

## 3. Where `ff2fca2` stands (the starting point — read the code)

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
   camera-derived heading (the suspended branch: the piece went −x while the gizmo went z).

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

**Step 5 — x / z on a top or bottom (no polar).** Over a top / bottom the gizmo moves along the world's x and z lines through it (a dy across the top
along the plane it came up in; a dx along the other), the orbit's frame tilted onto the face (§4.4: its heading the world's x or z, the gizmo's), switched
at the edge with nothing moving (a re-base: the spring, the lag, the leash re-read). **Still clamped**: the dy stops at the far edge (no crossing, no roll yet); a dx
stops at the side edges (no going over yet). Gate: I1–I6 with the clamp as the only stop.

**Step 6 — The crossing over the top / under the bottom (dy).** Open the dy's clamp: the gizmo across the WHOLE top with no roll (the zenith passed
with nothing turning), the half roll AT THE FAR EDGE (§4.1), the input reversed after it (§4.2), the gizmo down the far side in the SAME plane. The finger's
axes LATCHED for a drag (and its coast), each a whole screen axis; the edge roll REVERSES them (never re-read off the rolled picture — looking down a top the
axes swap screens). Gate: a constant dy loops the vertical plane, stopped only by the roll at the far edge (no roll, no stop mid-face); reversed, it goes on;
I1 throughout.

**Step 7 — The side crossing (dx over a top's side edge).** Open the dx's clamp: the quarter roll AT the edge, the piece waiting (§4.3, Q2); the plane
carried over. Gate: a constant dx started on a top loops the vertical plane across it, stopped only by the roll.

**Step 8 — The overhangs and the steps of the sections.** ⚠ (2026-11-04) See also the SLIDE wedged under an overhang (`HOVER.md` §0, item 21) — a
future improvement of the slide, not of the orbit; a candidate gate here: *no slide ends where no way out is free*. What a section meets beyond a flat box: an overhang's hidden faces (the shadow along the face),
gaps under `shadowBridgeMm`, a face cut off by a step deeper than `shadowStepMm` (150 mm in Scene_1 — the notches kept, Piece45's side cut), a section
through an overhang alone (R3), a section exactly on an outline (R4) — the gizmo jumping steps, the piece and the camera on the shell (Step 2). Gate: I1–I4
across all of Scene_1's protrusions; no stop that is not a discontinuity of the section's own contour.

**Step 9 — Near square in the middle, the full orbit at the edges, at every distance.** The piece's SHOWN direction calmed toward the face's normal in
its middle (a share of the orbit's angle), whole within an edge zone and through every crossing (the suspended branch's fourth pass, its sliders), the shares
FOLLOWING their targets (never read at once — a column of another height moved the camera 15 cm). **At every distance, ATTENUATED by a proportional gain as
the distance grows** (the owner, Q3). ⭐ Recommended (to be judged on the device): the full calm close in, falling smoothly to a FLOOR — about half the calm
— at the far distance, never to none: close in a square view is what lands the piece; far out the whole assembly is on the screen, a square view flattens
it (the gizmo's place on the face reads well, its depth and the edges' nearness less), a part-slanted one keeps the sense of turning round a solid. The gain
a smooth function of the distance — an approach (A + drag) then turns the view smoothly, never a jump; the floor a slider. Gate: I2 above all — the calm
never makes a jump at an edge, a face switch, the zenith or under an approach.

## 6. Lessons carried from the suspended branch (`1.0.92-Tilted-orbit-suspended`) — read before building

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
* **Q3** — the calm: *"near-square calm at every distance, probably attenuated with a proportional gain when the distance increases (I don't know if this helps
  viewing better from a far distance the place of the gizmo when the gizmo is close to the edge vs. a slanted view: advise what is best)"* → Step 9 (the
  advice: a floor of about half, a slider, judged on the device).
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

