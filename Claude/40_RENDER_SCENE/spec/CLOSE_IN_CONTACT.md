# THE ORBIT AT CONTACT — the slide removed, one contact rule close in (branch `1.0.122-`, from `12dc4b6`)

⭐⭐⭐ **2026-11-13 — READ §10 FIRST.** §1 – §9 are the TRIAL (`1.0.122-`, now `1.0.122-Trial-of-removing-the-slide-not-used`; the owner, on the device: *"your removal of the slide introduces a lot of issues. It has to be re-built properly"*). The removal is REBUILT on `1.0.126-Slide_removal` from `785ea5a` (`1.0.125-Debug_scene_0`, the orbit on any shape): the trial's decisions (§1, §3) and builds (§4, §6, §8, §9) replayed, the causes of its issues found and fixed (§10). This file came over from the trial's branch unchanged but for this note and §9 – §10.

> The owner (2026-11-12): *"when the piece collides with its face or edge onto the hosting face contour, the orbit is very much slowed likely because the
> slide around the collided object takes over … the slide triggers when the resting face is aligned with the hosting face contour and the distance is less
> than the threshold. That interferes with the orbit at very close distance. Furthermore, I think the slide is not required at all any longer because the
> feature of pan of the piece is already available through the tilted-pole orbit. I intend to therefore completely remove the slide function … keep whatever
> is still useful for the game (the snap into seated position, etc.), the distance range at which the snap can occur, how to treat collision slide vs.
> orbit, etc. Propose something holistically. Review the literature for patent-free license-free elegant solutions."*

## 1. The decisions (2026-11-12, the owner)

| | decided |
|---|---|
| **The slide** | REMOVED whole: the latch, the settle, the slide view and its limited orbit, the slide camera's shift, the way out's re-base, the hover's way in / out, the lit contours holding the orbit, `orbitBandSpent`, the slide's arming, its lock cone; ~9 sliders (`hoverGain`, `hoverFrictionMmS`, `hoverAmplitudeMm`, `hoverInertiaMs`, `hoverDampingRatio`, `hoverLeadMs`, `hoverGizmoMove`, `slideOrbitDegPerMm`; `hoverApproachMm` renamed, below) |
| **Q1 — at a wall** | **(b)**: the gizmo and the camera STOP with the piece (the orbit stays slaved to the solved place, as today) — but the move ALONG the wall at full speed, never a crawl |
| **Q2 — the contact readout** | **KEPT, display only**: the resting contour green, the contact shadow, the host's outline — no latch, no hold on the orbit |
| **Q3 — the solver** | *"do what is lightest weight on the game and works properly"* → the EXISTING solver kept and fixed at contact: (1) the face the piece rests on a SUPPORT, not an obstacle, for a move along it (its height the approach's); (2) only if the probe shows a crawl left, the slide along a wall in one full step (≤ 4 verified passes — collide-and-slide). No second solver, no seam |
| **Q4 — a magnet** | **No** — the goal capture alone (5 mm / 3° in the world, the exact pull, placed, the finger spent) |
| **Q5 — precision** | the slide's KINETIC FRICTION (a slow finger moves the gizmo less; a slider, 0 off) on the close-in orbit — ONLY with the resting face ALIGNED to the face it would rest on (anti-parallel within 2°) AND within a distance threshold of it — the SAME test as Q2's readout: ONE threshold (`contactBandMm`, the renamed `hoverApproachMm`, 20 mm) with a hysteresis (on below 20, off beyond ~25) |
| **The way out** | the collision check on a step OUT (`approachStepFree`; a blocked one named on the HUD) KEPT (*"we still need a collision check at way out"*); only the slide's re-base goes |
| **Kept** | the approach (A + dy / two fingers) to the 1 mm gap; the goal capture; the quads' turn and the tap that picks the resting face; the blocked pop-up and the respawn (§28's *"a slide is a way out"* removed); the face map's `Rect2` (moved out of `input/hover.ts`) |

**Moot with the slide**: `HOVER.md` §0 items 8 (the latch risk), 20 (a settle stopped short), 21 (wedged under an overhang), 22 (stuck in a slot); the slide under the tilted pole.

**The literature** (all published before 2006 — any patent long expired; nothing to license): the god-object (Zilles & Salisbury 1995) and the virtual proxy
(Ruspini, Kolarov & Khatib 1997) — a stand-in that stays on the surfaces and slides along them toward the target; collide-and-slide (Fauerby 2003, after
Nettle and Rouwé; Quake's slide move, 1996) — clip the move against ≤ N planes, follow a crease, stop at three; an object moved on the surface behind it
(Oh & Stuerzlinger, GI 2005) — the movement surface from the whole overlap, not a point (the SUPPORT); conservative advancement (Mirtich 1996, already the
solver's) for the long free steps.

**The steps** (each its own commit; vectors RED on the old code first; ⛔ only a device look closes): **0** the probe — **1** the slide removed (the kept items
above) — **2** the support, then the full-speed slide along a wall if step 0 / the walks still show a crawl — **3** the precision in the shared band —
**4** the device.

## 2. Step 0 — the probe (2026-11-12, `scripts/probes/contact_probe.mjs`)

Headless Chrome on the dev server; the cube; the piece set FREE (0.3 m from the gizmo) or brought to CONTACT (A held + a drag in until the approach stops);
then a one-finger drag of 2 px a frame × 40 (80 px ≈ 21 mm). Each frame: the exact gizmo, the piece, the solver's work, the slide's state.

| run | before the drag | the gizmo / the piece (mm) | the slide | the solver |
|---|---|---|---|---|
| top, free, dx / dy | 0.3 m | 569 / 1184 · 505 / 1149 | — | 1 query a frame |
| **top, contact, dx / dy** (resting face aligned) | the approach stops 6 – 8 mm from the gizmo; the slide LATCHED on Piece44's face | **0 / 27 · 0 / 42** | ON all 81 frames — the orbit's angles unchanged on 80 of 81 | idle |
| top, 12 mm, dx | the contours lit | 4.8 / 44 | latched on Piece4's face after 11 frames | — |
| front, free, dx / dy | 0.3 m | 491 / 1937 · 596 / 1633 | — | 1 query a frame |
| front, contact, dx (resting face ⟂ the face) | 7.3 mm | 479 / 580 — **0.98 ×** the free gizmo | none | touched 5, blocked 10; ≤ 31 queries in a frame |
| **front, contact, dy** | 1.0 mm | 220 / 271 — **0.37 ×** | latched on Piece4's face mid-drag (38 frames) | **touched 24, deferred 17, blocked 31 of 81**; ≤ 31 queries |

**Read**:
1. ✅ **The owner's second point, confirmed and total**: with the resting face aligned at contact the slide latches by itself and the one-finger drag moves the
   gizmo **0 mm** — the orbit is gone, not slowed.
2. ✅ **The first, confirmed for dy at contact**: the gizmo 0.37 × the free run's, the solver deferring and blocked on most frames (and over its 24-query
   budget on some). dx along the front at contact: not slowed (0.98 ×).
3. ⚠ **Not separated yet**: keeping the slide from latching in the page failed (its arming is set again inside the frame), so the solver's contact alone is
   measured cleanly only once step 1 has removed the slide — the same probe then is step 2's baseline.
4. ⛔⛔ **FOUND — THE CLOSE-IN GAIN**: the orbit moves the gizmo **~25 mm per mm of finger** (570 mm for 21 mm), the same at 0.3 m and at contact — the
   orbit's degrees per mm times the assembly's size. The slide placed the piece EXACTLY under the finger (1 : 1). Without it one pixel of finger is ~7 mm of
   gizmo — more than the goal's 5 mm margin. Q5's kinetic friction (`speed / (speed + 8 mm/s)`) scales a slow finger by a fraction; it cannot close 25 ×.
   ⭐ **An owner's decision before step 1** (§3).
5. ⚠ The free runs cross the cube's edges (the automatic tilt, its holds), so the ratios are rough; the contact runs stay on one face.

### 2.1 Redone with the resting face NOT aligned — the slide out of the way (2026-11-12)

> The owner: *"Redo your probe with the resting face not aligned"* — *"do your probe with the piece oriented so that it collides on the hosting face with
> an edge … This way the slide will not interfere with the collision-slowed down orbit."*

`MISALIGN=edge` (the piece turned 45° about the world's x: an EDGE of the resting face onto the top, and onto the front) and `MISALIGN=1` (the resting face's
normal (1, 1, 1)/√3: a CORNER down); 1 px a frame × 30 (≈ 8 mm of finger) so each run stays on its face. The contours never lit, the slide never latched.

| run | the piece from the gizmo | the gizmo against the free run | the solver |
|---|---|---|---|
| **EDGE**, top, dx | 3.2 mm (in contact) | **0.23 ×** (43 mm against 189) | blocked 32 of 61 frames |
| **EDGE**, top, dy | 3.2 mm | **0.20 ×** | blocked 42 – 59 of 61 |
| **EDGE**, top, dx from 12 mm (the edge already touching) | 12 mm | **0.23 ×** | blocked 49 of 61 |
| **EDGE**, front, dx (the edge on Piece44) | 25 mm | **0.23 ×** | blocked 30, deferred 6 |
| EDGE, front, dy | 28 mm | 1.02 × | free |
| CORNER, top, dx / dy | 0 mm | 0.78 × / **0.20 ×** | blocked 32 / 34 – 51 of 61 |
| CORNER, front, dx | 19 mm | 0.75 × | blocked 20 |

**Read**: ✅ **the owner's first point, confirmed with no slide at all** — an edge resting on the host face slows the orbit to about a FIFTH. ⭐ **Not the
work cap**: the solver's median is 1 query a frame; it is BLOCKED — most of each step pushes into the host face and is discarded (`projectExact` leaves a
small remnant). ⇒ the SUPPORT (Q3 (1)) is the fix that answers it; step 2 measures whether anything is left for (2). ⛔ The close-in gain stands: free on
the top, 30 px (≈ 8 mm) moved the gizmo 189 mm — **~24 ×** the finger.

## 3. ✅ DECIDED (2026-11-12, the owner: *"1b, 2a, 3 proceed"*)

1. **The close-in gain — (b)**: the orbit's degrees per mm scaled down CONTINUOUSLY as the approach's distance shrinks — one rule from far out to contact,
   no band, whatever the alignment (Q5's kinetic friction stays as decided: in the shared band, aligned).
2. **The support — (a)**: the gizmo's facet and its coplanar regions are the support WHATEVER touches them (a face, an edge, a corner): a move along it is
   never slowed by it; every other part stays an obstacle (Q1 (b): stop, slide along at full speed).
3. **Step 1 — proceed**: the slide removed.

### 3.1 The question as it was put

Close in, what is the finger's gain on the gizmo once the slide (1 : 1) is gone? Candidates: (a) in the contact band the gizmo moves UNDER the finger on the
face (the slide's two-ray mapping, `rayPlaneCoords`, kept for the orbit's gizmo) — 1 : 1, the kinetic friction on top; (b) the orbit's degrees per mm scaled
down by the approach's distance (a continuous gain from far out to contact); (c) Q5's friction alone (measured insufficient — 25 ×).

## 3bis. (superseded by §3) The owner's decision before step 1

Close in, what is the finger's gain on the gizmo once the slide (1 : 1) is gone? Candidates: (a) in the contact band the gizmo moves UNDER the finger on the
face (the slide's two-ray mapping, `rayPlaneCoords`, kept for the orbit's gizmo) — 1 : 1, the kinetic friction on top; (b) the orbit's degrees per mm scaled
down by the approach's distance (a continuous gain from far out to contact); (c) Q5's friction alone (measured insufficient — 25 ×).

## 4. ✅ Step 1 BUILT (2026-11-12, `1.0.122-`) — the slide removed whole; ⛔ no device close

**Deleted**: `src/input/hover.ts` (~900 lines), `src/render/hover_wiring.ts` (~1 100 lines), `tests/hover.test.ts`, `tests/slide_edge_letgo.test.ts`; the hover / slide
state (`st.hover`, its follower, its view, its offset and way in, its drawn lag, the latch's arming, `asmLocked` / `asmLock` — the close-in lock was the
slide's only); the press on the piece that slid (`hoverPressNote`, `hoverDragStep`: a drag from the piece orbits); the lit contours holding the orbit; the
gizmo and the sections hidden while lit; the slide view's camera (the corner, its arc, the limited orbit, the rig's shift, the up rolled upright); the way out's
re-base (`slideWayOutRebase`, `orbitForCameraDir`); a slide as a way out of the stuck check (`slideProbeFree`); the lock's cone (`LOCK_CONE_RAD`, `lockCone`,
`coneClamp`, `leavesCone`); `bodiesBehindPlane`; eight sliders (PIECE SLIDING whole; the hover's gizmo / amplitude / gain; the slide camera's °/mm).
**Kept**: the contact readout — `src/input/contact.ts` (`faceContact`, the overlap, the coplanar outline's rectangles, the shadow's projection) and
`src/render/contact_wiring.ts` (`contactFrame`: the shadow, the face's fill, the outline, the resting contour green; display only); its band `contactBandMm`
(was `hoverApproachMm`, 20 mm, its slider in OBJECT TRANSLATION); the approach's way-out collision check (`approachStepFree`, a blocked one named); the goal
capture; the quads; `upSquareToView` (the camera's up squared to its view — what `uprightBlend` did at the slide view's weight 0).
**Vectors**: `tests/contact.test.ts` (the contact vectors carried, the removal pinned), `tests/orbit_goals.test.ts` (the orbited goals, carried unchanged);
the source pins of eleven suites updated; the new ones RED on `0815892` (6 failed, `contact.test.ts` unloadable). **1646** (1744 − 98 with the slide).
**Probed** (`contact_probe.mjs`, 1 px × 30): **aligned at contact, the slide gone — the orbit moves**: on the top the gizmo 43 mm (dx) / 52 mm (dy) where it
moved **0** (§2), the readout lit every frame; ⚠ still ~0.2 × the free run's, the solver BLOCKED on 32 – 50 of 61 frames — the edge too (0.20 – 0.23 ×,
unchanged): **step 2's support** is what answers it.

## 5. Step 2 — the diagnosis before the build (2026-11-12): the slowdown is a STEP of the real surface, not the host face

Probed (`contact_probe.mjs`, the distance SET — no approach drag; its blocked flag is sticky and had carried the approach's push into step 0's counts):
over the cube's top the orbit turns **28.8°** for 30 px at 1.0 m and 0.3 m, **7.9°** at 20 mm and at contact — at 20 mm, far from any contact, the yaw
steps 1.35° a frame, then 0.58, 0.13, 0.01, 0: the solver BLOCKED with nothing TOUCHED. The gizmo stood on `Piece44` (proud of the top by 41 mm, x 0.0005 …
0.0455) and stopped at **x 0.0455 — its edge**. ⭐ **The root**: close in the piece hangs from the gizmo itself (the shell's foot is the gizmo within 60 mm),
and the gizmo follows the REAL depth (D3); off a proud part's edge the gizmo drops 41 mm, so the piece's anchor JUMPS down (`ringJump`); the landing would
put the piece into the part it is still over — refused — and a refused jump that is no narrow void is a WALL (`solveOrbitStep`, R4 / §6 (b)): blocked. At
0.3 m the shell's smooth foot carries the piece over the step. Directly over a flat face nothing blocks (measured: every step taken whole, one query).
⇒ The support as decided (§3, 2 (a): the gizmo's face not an obstacle for a move along it) does NOT reach this case: a move along a flat face was never
slowed. The proposal: **the FOOTPRINT support** (below, the owner's decision).

## 6. ✅ Step 2 BUILT (2026-11-12, `1.0.122-`) — THE FOOTPRINT SUPPORT (the owner: *"Proceed"*; *"make sure there is no regression for the polar orbit and the tilted-pole orbit"*) — ⛔ no device close

**The rule** (`src/input/footprint.ts`, Oh & Stuerzlinger's whole overlap area): of the placed parts whose outline, seen along the gizmo's FACE normal,
overlaps the piece's own at its SOLVED place, the support is the highest whose top is not above the piece's bottom (`SUPPORT_SLACK_M` 0.5 mm) and not further
below it than the shell's offset (`orbitShellOffsetMm`, 60 mm — where the piece hangs from the gizmo itself); a part above the piece's bottom is a WALL (Q1 (b)),
never a step up. **The wiring** (`supportFrame`, at the head of `assemblyFrame`, once a frame): the support's LEVEL along that normal — a rise at once, a drop
eased (`supportLevelStep`, τ 40 ms) and taken only where the piece FITS (one gap query, in the frame's budget; not free: held); `footOf` raises the gizmo to it
(`levelRaise`) before the shell's foot. No level is ever made from the gizmo alone: a support's level eases down to the gizmo, then clears.
**Measured** (`contact_probe.mjs`, the distance set, 30 px over the cube's top): the orbit **28.8°** at 1.0 m, 0.3 m, **20 mm and the contact** (7.9° at 20 mm
and at the contact before); the gizmo 186 – 191 mm; nothing blocked.

**The regression checks** (the owner's request; `walk_probe.mjs` 8 scenarios — far, mid, close, very close, random — and `tilt_probe.mjs` 38 scenarios, the
same on `a3047f9` and on this code, compared with `walk_compare.mjs`): four flaws of the first wiring FOUND by them and fixed —
1. a drop of the level was not collision-checked: over the top's channel the piece came down INTO `Piece22` (the footprint read the parts' visible cores, not
   their contours) and stayed → a drop only where the piece fits;
2. the level read along the PIECE'S direction (the calm's, 14° off the front): the approach ran in against a slanted support, the raise lost as the direction
   turned — inside `Piece4` → along the gizmo's face normal;
3. the footprint read at the DRAWN pose (the spring's lag): a high part read as under the piece's bottom — 197 mm in a frame → at the solved place;
4. the support unbounded and a fallback level made from the gizmo alone: far out (6 m) a proud part's front "supported" the piece, its foot pushed 41 mm →
   the window (the shell's offset), no level from the gizmo alone.
**The result** (the last run): **the polar orbit — no regression**: in `far_rings`, `far_meridians`, `mid_rings_zig`, `close_top_grooves`, `close_corners` the
support never engages (0 frames with a level, recorded per frame — `walk_probe.mjs` records `sup` / `lvl` now): the old code's path exactly; their small
differences are the walks' own run-to-run noise (`mid_rings_zig` 0 → 2 piece jumps with no support at all). **The tilted pole — no regression**: no scenario
of the 38 worse (the largest look / roll / gizmo step per scenario, > 25 % flagged: none). Where the support engages (`close_top_I14`, `vclose_top_front`,
`random_0`): `close_top_I14` level with the old code; the others' extra piece jumps within that noise; `vclose_top_front`'s stall time on a different path
after ~frame 867 (the old code stalled earlier). Totals: blocked stalls 25 → 26, piece back-and-forth 6 → 1, against the finger 115 → 107. ⚠ The walks are
history-dependent: close in, where the old code was stuck the new one goes on and meets places the old never reached.
**Vectors**: `tests/footprint.test.ts` (9: the measured `Piece44` case, cleared, a wall, beside, any face, the window, the level's ease, the raise, the wiring;
RED on `a3047f9` — the module absent); `orbit_shell.test.ts`'s `footOf` pin. **1655**. The probes' disk hygiene: Chrome's TEMP / TMP inside the per-run profile,
its updater off (`scripts/probes/*.mjs`); `tilt_probe.mjs`'s watchdog 30 min (897 s of 15 on a loaded machine).

## 7. Step 4 DROPPED (2026-11-12, the owner)

> *"Aren't step 3 and step 4 doing the same thing?"* → *"Drop step 4 for now and if needed, revise step 3 to cover the requirements that needed a step 4"*.

Q5's slow-finger friction in the contact band is dropped: step 3 (the gain scaled by the approach's distance, 1 (b)) answers the fine placement on distance;
if the device shows it is not enough, step 3 is revised to cover it — no second gain on speed.

## 8. ✅ Step 3 BUILT (2026-11-12, `1.0.122-`) — THE CLOSE-IN GAIN (the owner's 1 (b); *"Proceed"*) — ⛔ no device close

**The rule** (`closeInGain`, `input/assembly_orbit.ts`; speed proportional to the distance to the surface — Ware & Fleet's context-sensitive flying, 1997):
around the assembly the orbit's yaw AND pitch per mm of finger are its full gain from `orbitGainFullM` (0.6 m, the automatic tilt's distance) out, falling
LINEARLY with the piece's distance to the gizmo to the contact, where the gizmo travels `orbitContactMmPerMm` (1 mm — the slide's 1 : 1) on the surface per mm
of finger (the full gain read at the assembly's radius). Two sliders (☰ → CAMERA → CAMERA ORBIT AROUND CENTER), both guesses until a hand sets them. Wired in
the drag (`orbitDragStep`: dx and dy × `kd`); the coast records the scaled steps. Beyond 0.6 m the gain is exactly 1: the far orbit is the same code path.
**Measured** (`contact_probe.mjs`, the cube's top, 30 px ≈ 7.9 mm of finger): 1.0 m **28.8°** / 184 mm (unchanged); 0.3 m **15.1°** / 117 mm; 20 mm **2.25°** /
12 mm; the contact **1.34° / 7.3 mm** (~0.9 mm per mm; ~190 mm before).
**Vectors**: `tests/close_in_gain.test.ts` (5: the contact's 1 : 1 from the probed gain, full from `fullM` out, linear and monotonic, degenerate inputs, the
wiring, the tunables; RED on `e6be90c` — the function absent); four suites' source pins of the drag line updated (`* kd`). **1660**.
**The tilted pole — no regression**: `tilt_probe.mjs`'s 38 scenarios (1.0 m and out: the gain 1 there) none worse than on `a3047f9`.

## 9. The trial's last commit (`473fe76`, 2026-11-12; recorded here 2026-11-13 — the trial left its md as it was)

* **The owner's defaults, set on the device**: `orbitContactMmPerMm` **4** (the gizmo's mm on the surface per mm of finger at the contact; §8's 1 was too slow)
  and `orbitGoalMm` **10** (the orbited piece's goal margin, the snap's reach).
* **The solver's contact test** (`piece_orbit_solver.ts`, `intoContact` / `TANGENT_TOL`): a step's feasibility against a contact was a product against
  `1e-12 × |a|`, blind to the step's length — a ring level to 1e-8 read as pushing INTO the floor, and the projection took the whole yaw away (the channel on
  `Piece22`: a slow dx blocked 7 mm short of the wall in free air; the front face, a dy at contact blocked on 108 of 121 frames → 18). Now a step is INTO a
  contact only past a tolerance on its own length. Vectors: `tests/solver_tangent.test.ts` (4; two red before).

## 10. ✅ THE REBUILD (2026-11-12 – 13, `1.0.126-Slide_removal`, a worktree `slide_removal` from `785ea5a`) — ⛔ no device close

> The owner: *"Re-build the removal of the slide (refer to branch 1.0.122-) with the same target features (gizmo speed proportional to the distance, sliders,
> default value of the sliders, sliding around obstacles, snap, etc.). Make sure the issues we faced on 1.0.122- are not repeated (friction of piece's edge or
> resting face onto the hosting face, etc.). Make sure the removal does not introduce regressions: no camera view tilt, no upside down scene, no jump nor roll
> nor tilt of gizmo/piece/camera at crossings. Place a particular attention to the teleport issue: when we orbit in polar orbit and approach the piece onto the
> bottom of the black channel, the tilted-pole orbit dx can then teleport the piece to the other channel or even climb the piece on top of the top face. …
> perform random walks … Also, perform random walks on the scene 0's extruded heptagon."*

### 10.1 Replayed

The trial's four code commits onto `785ea5a`: `a3047f9` (§4, the slide removed whole, the readout kept), `e6be90c` (§6, the footprint support), `f08b6f6`
(§8, the close-in gain), `473fe76` (§9, the contact test, the defaults 4 mm/mm and 10 mm). The conflicts with `1.0.125-`'s orbit on any shape resolved for
it: the support's gap query and the stuck probe charged to F5's one ledger a frame (`st.pieceQueries`, `queriesLeft`; the trial's carry gone); the tilt's
`tiltHeading` kept. Same features, sliders and defaults as the trial.

### 10.2 The trial's issues — their causes, each reproduced headless before it was fixed

| the issue | the cause | the fix |
|---|---|---|
| **the friction** (the resting face or an edge scraping on the host, the orbit crawling) | ⭐⭐⭐ **GJK read a face-parallel gap as CONTACT**: `nearestOnTetrahedron` judged a flat simplex by an ABSOLUTE volume (`\|6V\| ≤ 1e-18`); two bodies face to face give support points coplanar to rounding (~1e-12 at these sizes), read as solid, the origin inside — a gap of **0** where the exact gap was 2.8 mm (walked on the heptagon's slanted face: 2.813, 0, 2.813, 0 along a parallel move). Wrong on 181 of 3 000 random face-parallel pairs at 0.5 – 5 mm. The solver took free air for a wall: blocked, projected, relocated | the flatness judged against the simplex's own SCALE (`\|6V\| ≤ 1e-9 × e³`, `e` its longest edge; `core/collision_shape.ts`): 0 of 3 000 wrong; GJK's 63 earlier vectors unchanged |
| ⭐⭐⭐ **the teleport** (the channel's floor, the tilted pole, a dx: the piece across to the other channel, or on the top face) | the RING moved under the solved piece between frames, unchecked — the map's catch-up, the calm's direction, an eased glide or tilt relocation (`asmGOff`), the support's eased drop: 2 – 5 mm a frame INTO the channel's wall or floor; once inside the margin, the frame's relocation searched up to **0.4 m** along the ring for a free place — across the channel, onto the top | ⭐ **the ring's hold** (`input/ring_hold.ts`, a proxy — Zilles & Salisbury 1995, Ruspini et al. 1997): a ring move that closes on a part is HELD in a world offset added to the ring (the piece stays where it really is); released toward the ring by checked steps no longer than the clearance allows (conservative advancement, ≤ 4 mm) — against a wall it stops at the wall; a move over 0.1 m onto a FREE place is a re-base (a reset), onto a part it is held like any drift; no queries left: held. ⭐ The relocation bounded to **3 cm** (`RELOCATE_MAX_M`, was 0.4 m), a last resort |
| the piece sinking into its host close in | the lift (the piece's extent along the face's normal) changing as it turned, the gizmo's foot fixed | ⭐ **the rest** (`restRaise`, `input/footprint.ts`): the piece, solved AND drawn (`restDrawn`), raised along the level's normal to rest one gap (+ 0.25 mm) above the support — on a face, an edge or a corner |
| corners cut at a support's drop | the eased drop (τ 40 ms) taken at 6.5 fps in steps of the whole drop | the drop on the same face waits for the drawn piece's footprint to clear the part; the ease's dt clamped to 33 ms |
| ⛔ a 524 mm leap through a part (`close_top_I14`) | a STALE support level read along ANOTHER face's normal (the front's level held the piece 0.5 m off its gizmo on the top, then let it go) | a level applies only on the face it was read on (`levelOn`: normals within 0.999); another face's level is taken at once |
| a jump crossing (R4) landing beyond a part | the crossing checked its LANDING only | ⭐ the straight move there swept too (`straightFree`, conservative advancement on `gapAtAnchor`, ≤ 4 queries) |
| an approach IN read as free past the contact | the rest raised the probed place | the rest off while the approach probes (`asmRestOff`) |

### 10.3 The walks (headless, `walk_probe.mjs` + `walk_teleport.ts`; the rebuild against `785ea5a` WITH the slide)

`walk_teleport.ts` (new, `npx vite-node`) reads a walk's recorded hulls: **INSIDE** (the piece's gap 0), **TUNNEL** (the swept hull between two frames meets a
part neither pose meets; a `reset` leg skipped), **LEAP** (> 15 mm in a frame on an orbit leg within 150 mm). Scenario sets (new):
`walk_scenarios_channel.json` (the owner's channel case), `walk_scenarios_s1_travel.json` (polar → tilted pole, close in and at contact, edges, obstacles),
`walk_scenarios_heptagon_contact.json` (`Scene_0`). Frames inside a part / tunnels:

| walks | rebuild | with the slide |
|---|---|---|
| `Scene_1`, the channel (6) | **0 / 0** | 125 / 14 |
| `Scene_1`, at contact | **0 / 0** | 3 394 / 9 |
| `Scene_1`, polar → tilted pole, obstacles, edges | **0 – 1 / 1 – 2** | 384 / 15 |
| `Scene_1`, the standard and random sets | **0 – 1 / 0 – 4** | 37 – 101 / 9 – 39 |
| `Scene_0`'s heptagon (2 sets) | **0 – 2 / 0 – 1** | 2 597 – 3 265 / 9 – 49 |

* **The channel**: the piece crosses wall to wall and runs the channel's length on its floor; never out of it, never on the top.
* **The friction**: `contact_probe.mjs` on the top, the resting face down and an edge down — blocked on **0** frames (the trial: most); the gizmo ~4 mm per mm
  of finger at the contact (the owner's default).
* **The regressions asked about**: the camera's rolls and tilts, the view upside down, the gizmo / piece / camera jumps — FEWER than with the slide in every
  set (about half on `Scene_1`; the heptagon upside down 7 against 36).

### 10.4 Open — all present before the rebuild

* **The heptagon's zenith ridge**: a dy held up flips the tilt between the two top faces, the piece back and forth (8 – 60 mm) — more often now the piece
  orbits close in instead of sliding. The ridge rule (F2b, `ORBIT_ANY_SHAPE.md`) is `1.0.125-`'s; its §8 (the dy held after a pole-holding face's far edge,
  `d70bba4`) is not on this branch — the merge brings it.
* **The crossings' timed turns** read 40 – 60 mm a frame in the walks — headless runs at ~6.5 fps (152 ms a frame); ~5 mm a frame on a phone: the eye decides.
* **A groove shorter than the piece**: a piece that dips in stops at its walls and ends, by design; backing out frees it.

**Vectors** (each RED on the trial's code first): `tests/gjk_flat.test.ts` (the three captured heptagon poses, fixture
`tests/fixtures/gjk_heptagon_face_parallel.json`; a 600-pair face-parallel sweep against an exact separating-axis reference), `tests/slide_rebuild.test.ts`
(the hold, the release, the re-base, the rest, `straightFree`, the wiring's pins); `footprint`, `orbit_shell`, `proto_piece_orbit`'s pins updated with their
reasons. **1716** (`785ea5a`'s 1775 − the slide's vectors + the trial's + these).
