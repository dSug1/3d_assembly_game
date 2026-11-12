# THE ORBIT AT CONTACT — the slide removed, one contact rule close in (branch `1.0.122-`, from `12dc4b6`)

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
