# POLAR ZONES — where the tilted-pole orbit stops, and the polar orbit about the zone's own axis (2026-11-13, branch `1.0.129-from_commit_601cc85`, worktree `debug_on_scene0bis`)

> ⛔⛔ **PROPOSED, NOT APPROVED, NOTHING BUILT.** The owner's decisions are open (§6). Written to become ONE module (`src/input/polar_zone.ts`) and to
> merge with the `3d_assembly_game-scene2` worktree's proxy faces (`30_OBJECTS_3D/spec/PART_AUTHORING.md` §3 item 3).
>
> The owner (2026-11-13), on `Scene_0bis`: *"on the tipped faces of the heptagon, the red and green sections as well as the movement of the gizmo are
> difficult to track and anticipate"* → *"it is better to limit the orbit to polar in the tipped faces … if the faces contour is small and many faces
> converge to a singularity, polar orbit shall be the only way"* → *"the polar orbit has to snap its pole to the local pole … a swap between green and
> red contours depending if the axis of the pole is closer to the scene's horizontal plane or the gravity vertical"* → *"if the poles' axis is not purely
> aligned with a world axis … a tilt is not an issue"* → *"it cannot be at boot: the assembly will change as the game progress"*.

## 1. The problem

### 1.1 What the walks found (`Scene_0bis`, `?sceneIndex=4`, at `601cc85`)
17 walks on `Scene_0bis` against the same 17 on `Scene_0` (flat ends), ~34 000 frames each (scenarios `scen_tips.json` + `walk_scenarios_any_shape.json`;
analysers `walk_analyse`, `walk_rules`, `walk_rope`):

| | `Scene_0` | `Scene_0bis` |
|---|---|---|
| line map jumps · gizmo leaps · gizmo jumps | 562 · 16 · 4 | **7 730 · 267 · 205** |
| gizmo off its lines · camera roll off the vertical · piece fly-off | 124 · 1 104 · 149 | **975 · 3 434 · 413** |
| green not a plane · rope not tight | 81 · 0 | **230 · 193** |
| blocked, camera jumps, upside down, tilt not world-aligned | similar | similar |
| red not a plane (open since `ORBIT_ANY_SHAPE.md` §8, not the tips') | 694 | 645 |

The four defects, all in the face map on the tips (illustrated: the artifact *Heptagon Tip Defects*, https://claude.ai/artifact/SvCgt4RudAqGjWtfgCDMPx):
* **B1 — a 281 mm leap at the zenith**: at pitch 90° the tip's middle column puts the gizmo on the APEX (mid-height), its neighbours on the ridge's end; a
  dx at the zenith crosses 240 mm of height in ~15° of yaw (36 mm / °) — one or two frames in the walks, the piece jumping 71 – 101 mm.
* **B2 — the apex pin**: yaw ±5° × pitch 24.5 – 90° all map onto the apex (the height clamped, `sAtHeight`); 42 % of the finger's frames on the +x tip.
* **B3 — the red zig-zags**: "the same share of the chord" on each triangle of a FAN lands at a different place on each — 650 – 880° of turning, 7 – 12
  kinks, 21 – 42 mm off any plane (the front: ~100°, planar).
* **B4 — the green dips to the apex**: above pitch 30° it is 32 – 184 mm out of level, up to 91 mm off its plane.

### 1.2 The root
The face map is a grid of COLUMNS (facets by heading) × BANDS (one pitch → height scale): a quad layout of loops. A tip is a FAN of 7 triangles meeting
at one point; the columns cut it into three (the middle one holds only the bottom triangle, its band to +90°). Its convergence point (valence 7) sits at
mid-height on a side — on none of the orbit's poles.

### 1.3 Why `Scene_0`'s end face may bend and the fan may not
`Scene_0`'s red on its end face turns 31 – 120°, ≤ 3 kinks, planar. It may bend because (1) the bend stays INSIDE ONE flat facet, (2) one facet's chord
varies continuously — no jump, (3) the reds converge at the face's top corner, the ridge's end — already the orbit's pole (the ridge holds it, F2b). In
quad terms: a four-sided patch, no interior pole. The fan fails all three.

### 1.4 What the literature says (sources at the end)
* **Loops end at poles** — Blender: a pole is a vertex of 3, 5 or more edges; a loop stops there, *"no unique way to continue"*. Quads exist so that
  loop cut, bevel and subdivision run; Catmull–Clark degrades at extraordinary vertices; bevel needs a vertex mesh where several bevelled edges meet.
* **Singularities are unavoidable** (Poincaré–Hopf): a cross field on a sphere-like surface has singularities of total index +2 — the polar orbit puts
  them at two points (+1 each), the tilted orbit on the cube at 8 corners (+¼ each). The choice is WHERE.
* **Carrying the frame across faces is parallel transport**; round a vertex it comes back turned by the angle defect (holonomy = angle defect).
* ⛔ No navigation paper found defines when an orbit must fall back to polar; the criterion comes from the layout's poles, not from curvature.

### 1.5 What does NOT discriminate (measured on the faces contour)
| | cube (`Scene_1`) | heptagon (`Scene_0`) | tipped heptagon (`Scene_0bis`) |
|---|---|---|---|
| real valence (virtual caps left out) | 3 | 3 | 4, **7 at the two apexes** |
| angle defect | 90° | 50 – 53° | 45 – 47°, the apex 37.5° |
| curvature density (radius) | 335 mm | 291 – 298 mm | 295 – 315 mm |
| facet size (2 · area / perimeter) | 242 mm | 151 – 226 mm | **tip triangles 71 – 73 mm** |

⭐ The VALENCE and the SIZE discriminate; the curvature does not. ⛔ A "multiple of 90°" defect rule fails too (the heptagon's 51° is accepted).

### 1.6 Already tried — not proposed again (`TILTED_ORBIT_REBUILD_SCOPE.md` on `1.0.107-Close-in-atlas`, `POLAR_ORBIT_CLEANUP.md` §8.5)
A global bijection orbit → surface (§31.4: occlusion, topology, sharp edges); the gizmo on the TRUE plane cuts (§28.4, §8.5); a simplified shell + cast
(§22, §27, §29 — RC4 / RC5); the carrier on the section's hull (`1.0.85-`); the ropes (§30 → J1 – J5); the world meridian red (`ff2fca2`, replaced by
Step 4: a 136 mm slide across a slanted face). ⭐ This spec changes none of them: it keeps the face map and changes the FRAME it is built in, per zone.

## 2. The model — what a polar zone is

* **A ZONE** — a connected set of facets of the faces contour where the tilted-pole orbit is NOT used: the orbit is polar at every distance, about the
  ZONE'S AXIS, and the face map is built in the zone's frame F (F's vertical = the axis).
* **Its POLES** P+ (the convergence point) and P− (the opposite end of the axis through the assembly): F's zenith and nadir.
* ⭐ Measured on `Scene_0bis` with the map built in F (the axis = x through both apexes): dx / dy steps moving nothing **0 %**; steps > 12 mm per 0.5°
  **0**; the apex only at the pole (0.56 % of the angles, like today's zenith); the ring round the axis **exactly planar**; the pole-to-pole section
  127 – 153° from apex to apex, 2 – 3 kinks (the rims), 0 – 6 mm off its plane; over the ridge continuous — **B1 – B4 gone from the map**. On the long
  faces the sections are today's (the green along x, the red the heptagon's cross-section). Each long face and its two tip triangles form ONE column,
  stacked along the rim edges — level in F.

## 3. Computed at RUNTIME — what, when

### 3.1 When
* ⭐ **With the face map** — it is already rebuilt when the PLACED SET changes (its cache key, `assembly_wiring.ts` `faceMapOf` / `worldFaceMap`), from
  the placed parts' EXPOSED faces (R1). The zones are one more pass over the contour's facets and vertices — no new trigger, no per-frame cost.
* ⭐ **And when the HELD part changes**, once ghost faces reach the game (`PART_AUTHORING.md`: a ghost serves ONE part, `for_part`) — the held part then
  joins the map's key.
* ⛔ **Not at boot only**: the play order is a PARTIAL order (`SCENE_2_ASSEMBLY.md` §2.3) — a seat covers a pole, merges coplanar faces (a vertex's
  valence changes), hides a seat face; only runtime knows the placed set.

### 3.2 The checks (on the faces contour, the WORLD frame, real facets only — a virtual cap counts for nothing)
Per facet, it KEEPS the tilted-pole orbit when all three hold:

| | check | measures | `Scene_0bis` tip triangle |
|---|---|---|---|
| **T1** | **valence** — every corner's real valence ≤ 4, or the corner on the orbit's own pole (the zenith / nadir, the ridge) | loops end at a pole | ✗ apex: 7, at mid-height |
| **T2** | **continuity** — it meets the facets stacked above / below it in its column along a LEVEL edge spanning its width (or it is alone in its column) | the red never jumps | ✗ slanted edges |
| **T3** | **size** — its size (2 · area / perimeter) ≥ `S_min` = `zoneFacetMinRatio` (0.22) × the smallest side of the PLACED set's box (D-Z1); optional, off by default: its section's runs between kinks ≥ `L_min` mm ON THE GLASS at the close-in distance (rule 3), no kink > `θ_max` | the bend is readable | ✗ 0.15 (71 / 483 mm) |

* **`S_min` is relative to the assembly AS IT STANDS** (the parts seated so far, recomputed at each seat with the face map) — ⛔ not the finished
  assembly, ⛔ not the held piece (the owner: stacked pieces have about the same width, so a piece-relative size would flag every stack). Fully built:
  `Scene_0bis` 0.15, `Scene_0` 0.31, `Scene_1` 0.50.
* T2 / T3 are asked only of a pole's star and the facets touching a zone (§3.3 — no zone without a pole): a stack's or a step's corners have valence
  3 – 4, so a narrow face there is never tested.

### 3.3 The zone (its amplitude)
1. **Poles**: the contour's corners failing T1 (real valence ≥ 5, not on the orbit's pole).
2. **Seeds**: each pole's STAR (the facets meeting at it).
3. **Growth**: the facets failing T2 or T3 connected (edge to edge) to a seed join its zone; zones that touch merge.
4. **A failing facet with no pole** (T2 / T3 alone): it joins a zone it touches, otherwise it KEEPS the tilted orbit — no zone without a pole (D-Z4);
   the proxy review flags it (🟠 / 🟡) for the author to fix in Blender.
5. **Exit hysteresis**: the gizmo leaves a zone `zoneExitMm` (guess 10 mm, a slider) past its rim — the §8 dy hold's model (`edgeHoldMm`) (D-Z7).
6. **A change at a seat** (a zone appears or goes, an axis crosses a bound of §3.5): only when a part is seated, a re-base (§3.4), never under the finger.
* Check on the scenes: `Scene_1` none; `Scene_0` none; `Scene_0bis` the two tips (14 triangles) — one zone if they share an axis (§3.4).

### 3.4 The zone's axis and frame
* **The axis a**: from the zone's base polygon's area centroid (its rim) to its pole P+; two zones whose axes are collinear within 10° are ONE zone with
  two poles (`Scene_0bis`: the line through both apexes). **Snapped onto a world axis within 10°** (the precedent: `snapHeading`, Step 4); an author's tag on the proxy wins (D-Z2).
* **P−**: where the axis leaves the assembly on the other side — an apex (two fans) or a cap (a flat face: built by the face map as a cap — radial
  greens, concentric reds, both planar).
* **The frame F**: F's vertical = a; F's yaw 0 = the world axis most perpendicular to a, projected square to a (a horizontal: yaw 0 = the world's up).
  The map built in F with the existing machinery (`mapFrame`, `tiltFaces`, `tiltBox`); cached with its zone.
* **Recomputed at a seat**: a changed axis is a RE-BASE — the map's angles re-read where the gizmo is (`mapAngles`), no jump.
* ⚠ Facets near 45° IN F (a world-level face becomes a side) — the proxy review's 🔴 must be read in F for a zone.

### 3.5 The orientation — the green / red swap, chosen by the camera's roll
In an orbit about a, the camera can put the axis vertical or horizontal on the glass: the one whose screen-up is closer to the world's up.

| angle(a, world vertical) | orientation | the glass | the finger | the camera's roll against the world |
|---|---|---|---|---|
| ≤ 30° | **S1 UPRIGHT** (today's, tilted) | up = a projected | dx → round the axis (GREEN = the ring); dy → pole to pole (RED) | constant: a's tilt, ≤ 30° |
| ≥ 60° | **S2 SPIT** (rotisserie) | right = a projected, toward P+ | dx → pole to pole (GREEN); dy → round the axis (RED = the ring) | follows dy, within R4: the §8 dy hold (§4.2 4.) |
| 30° – 60° | the author's tag `upright` / `spit` (§4.3); untagged: **S1** | — | — | the milder roll, R4 as today (D-Z6) |

`Scene_0bis`: a horizontal → **S2**: dx along the length toward a tip, dy turns the body about its long axis.

## 4. What is DELIVERED — the module

### 4.1 `src/input/polar_zone.ts` (engine-free; `tests/polar_zone.test.ts` its golden vectors, each shown RED on the old code where it replaces a behaviour)
```ts
interface PolarZone {
  facets: readonly number[];          // the contour's facets in the zone (world map indices)
  poles: { plus: Vec3; minus: Vec3 }; // P+ (the convergence point), P− (the other end)
  axis: Vec3;                          // a, unit, P− → P+, snapped within 10°
  frame: Mat3;                         // world → F (F's vertical = a, F's yaw 0 per §3.4)
  orientation: "UPRIGHT" | "SPIT";     // §3.5 (or the author's tag)
  reason: { pole: number[]; t2: number[]; t3: number[] }; // which check put each facet in (the HUD, the review)
}
function polarZones(map: FaceMap, opts: ZoneOpts): readonly PolarZone[];          // §3.2 – §3.4; with the face map
function zoneAt(zones: readonly PolarZone[], facet: number, prev: PolarZone | null, depthPastRimMm: number): PolarZone | null; // §3.3 5.
function fingerToFrame(o: PolarZone["orientation"], dx: number, dy: number): { dYawF: number; dPitchF: number };            // §3.5
function zoneScreenUp(z: PolarZone, view: Vec3): Vec3;                                                                      // §3.5's glass
```
`ZoneOpts`: `S_min` (`zoneFacetMinRatio` 0.22, of the placed set's smallest box side), `L_min` (`zoneRunMinMm`, 0 = off) and `θ_max`
(`zoneKinkMaxDeg`, 0 = off) — the device sets them if a shape needs them, the valence (5), the axis snap (10°), the bounds (30° / 60°),
`zoneWholeShare` (0.5, D-Z5), `zoneExitMm` (10) — each a `GestureConfig` field with a slider (one constant, one place; `config_debt.test.ts`).

### 4.2 Its effects (the wiring holds the state and the calls — no rule in `src/render`)
1. **A RESTRICTION of the tilted-pole orbit** — inside a zone the automatic tilt never fires (`tiltAutoLatch` off), no frame change at its facets' edges.
2. **The polar orbit about the zone's axis** — the face map built in F (`faceMapOf` keyed by the zone); the poles P± are allowed stalls (R7's exception,
   as today's zenith); the §8 dy hold and the §9 zenith roll apply at F's poles.
3. **The swap** — `fingerToFrame`: S2 sends dx to F's pitch, dy to F's yaw; the green is the pole-to-pole section, the red the ring.
4. **The camera** — up per §3.5; the calm computed in F; R4 / R5 restated IN F. ⛔ **R4 KEPT in S2 too (D-Z3, the owner)**: the camera is never
   upside down — the same rule as `Scene_0`'s §8 dy hold: where dy would turn the view over, dy in THAT direction is held until the finger reverses
   past the hysteresis (`edgeHoldMm`); dy the other way and dx stay free throughout. The body's back is reached by dx, along the green, round a pole.
   ⭐ As built (the crossing, the hold after it, the finger): §4.7.
5. **The transitions** — entering / leaving a zone: today's timed frame change (the gizmo held; close in pending through the approach, blended by the
   first 10 mm of finger, §9.15) (D-Z7). An S1 ↔ S2 change can be a quarter turn of the glass — its speed may need its own slider (the device decides).
   One frame at a time: the zone the gizmo is in decides. ⭐ The camera's turn itself (here, at the spit's zenith edge and its bottom face's middle):
   §4.6.
6. **The extent of F (D-Z5)** — the zone only, UNLESS the zone's facets plus the facets whose sections are the same in F and in the world cover more
   than `zoneWholeShare` (0.5) of the contour's area: then F for the WHOLE assembly (`Scene_0bis`: one spit, no transition from a tip to the body; its
   far view turns about the long axis instead of today's world polar orbit). An author's tag forces either.
7. **The readouts** — the HUD's orbit line names the zone (`polar zone 1 (spit) — the apex pole`); the walk probe records `zone`, `orientation`, F.

### 4.3 The merge with the proxy faces (`3d_assembly_game-scene2`, `PART_AUTHORING.md` §3 item 3)
* **Prevention at authoring**: the proxy principle (*simplified, as close to the real surface as possible*) — a part's proxy may replace a fan of small
  faces by fewer large ones, so a cone tip need not become a pole.
* **An override tag** on a proxy face: `orbit: "polar" | "tilted"`, and on a zone `orientation: "upright" | "spit"` (the ambiguous band) — read at
  import, winning over §3.2 (the way `for_part` already tags a ghost).
* **The review**: the step review's colours gain 🔵 *polar zone* (its axis drawn) — computed by THIS module, run headless on each step's placed set (W6),
  ⛔ never re-implemented in the Python build (a copy of a rule disagrees exactly when the rule changes — defect 66).
* ⚠ Not built there yet: ghosts in the game (the held part in the map's key).

### 4.4 Vectors to write first (red on `601cc85` where they pin a defect)
* `Scene_0bis` (its contour, a fixture): two poles, the 14 triangles in ONE zone, a = x, S2; `Scene_1`'s cube and `Scene_0`'s heptagon: NO zone.
* In F on `Scene_0bis`: no dx / dy step moving nothing off the poles, no step > 12 mm per 0.5° (RED on today's map: B1, B2); the ring planar; the
  pole-to-pole section within 6 mm of its plane (B3, B4 red today).
* The axis snap, the orientation bounds and the tag; the exit hysteresis; `fingerToFrame`'s signs (dx right → toward the P+ shown on the right).
* A seat that covers a pole removes its zone (the key changes, the zone goes).
* `S_min` on the PLACED set: two same-width pieces stacked → no zone; a fan judged against the set seated so far, not the finished one.
* S2's R4: dy toward the turn-over held, dy back and dx free, released past the hysteresis (as `Scene_0`'s §8 vectors).
* D-Z5: `Scene_0bis` → F for the whole assembly; a large box with one small tip → F on the tip only.
* ⛔ `Scene_1`'s cube map bit for bit (`scene_1_cube_map_grid.json`) — unchanged.

### 4.5 Proof, then the device
The same 17 walks on `Scene_0bis` and `Scene_0` (`walk_probe.mjs`, `walk_rules`, `walk_analyse`, `walk_rope`, `walk_teleport`) against §1.1's table —
B1 – B4's counts toward `Scene_0`'s; no regression on `Scene_1` / `Scene_0`. ⛔ A look on the device closes it (rule 5).

### 4.6 The camera's realignment — the piece and the assembly kept on the glass (2026-11-14, branch `1.0.129b-`)
Every turn of the camera a zone makes — entering / leaving it, the spit's side changing at its zenith edge and at its bottom face's middle — goes from
the POSE on the glass when it starts (`poseShown`: the eye, the aim, the up, and where the piece was drawn) to this frame's pose, at the tilts' one speed
(`tiltRollDegS`, 360°/s; its time from its own angle, read before it is stepped), the gizmo held (`tiltClampStep`). What the owner saw, and what each
step changed (probed far out, the camera 7.7 m from the assembly, the piece 1.3 m in front of it; the probe's landscape glass):
* ⛔ **About the view** (`5e7e78f`): only the up turned — the piece, off the glass's centre far out, went round it; and in the first frame it leapt to the
  opposite corner, (−0.27, −0.06) → (0.27, 0.76) of the half-glass: the view's offsets (`cameraPitchOffsetDeg`, `cameraYawOffsetDeg`) are laid in the
  heading's frame, the heading's half turn mirrored them (*"the piece snaps 180 degrees diagonally"*).
* ⛔ **About the piece** (`81b4bc0`, `poseAboutPiece`): one turn of the camera's axes, the piece's place on the glass carried straight to its new one —
  the piece's largest step in a frame 0.98 → 0.11 of the half-glass; but far out the ASSEMBLY swung round the piece (its centre out to 0.30 of the
  half-glass, 0.49 on a 0.67-wide glass: *"the assembly and scene sometimes fly off the screen view"*).
* ⭐ **The two framed** (`poseFramingTwo`, on `1.0.129b-`) — after Lino & Christie's **toric space** and Gleicher & Witkin's **through-the-lens** control:
  the camera solved each frame from where TWO targets are on the glass — the piece (A) and the camera's aim (B, its look point: the assembly far out,
  the gizmo close in). Their places (tangent coordinates) carried STRAIGHT from the start's to the end's — a straight line between two points of the glass
  stays on it (a rectangle is convex): NEITHER CAN LEAVE IT, whatever the glass. The angle they make at the camera follows; with the piece's distance
  carried, the camera lies on the toric surface of A and B, its place round the line A → B carried the way it began (kept past the half turn): the half
  turn is a turn about the line through both. Degenerate (the two on one ray from the camera, close in where the aim is the gizmo by the piece): about
  the piece alone — chosen at the turn's first frame and kept. Probed: the assembly's centre within 0.09 of the glass's middle through the zenith edge
  (0.14 on the 0.67-wide glass), 0.10 through the bottom face; the piece as before (straight, 0.51 of the half-glass from its old place to its new one).
* ⚠ **TO CUSTOMISE FOR A PHONE HELD UPRIGHT (portrait)**: Babylon's vertical FOV is fixed (0.8 rad), so on a 390 × 844 glass the half-width is ~11°
  against ~41° on the probe's landscape glass. The turn keeps both targets on whatever glass holds them at its ends — but the FRAMING ITSELF far out
  (the view's offsets put the piece ~13.7° off the axis) leaves the piece ~1.2 half-widths out even at rest. The offsets / the FOV (or a horizontal FOV
  fixed in portrait) need their own values in portrait; not done. (The probe's `WINDOW=w,h`: headless Chrome stays ≥ ~500 px wide — project the recorded
  poses on a narrower glass instead.)
* Not covered: the rest of the scene (the floor, the plinth) turns about the A → B line — it is what moves on the glass during the half turn.

### 4.7 The spit's crossing and its hold — rebuilt on `Scene_0`'s model (2026-11-14, `1.0.142-Pick-up-of-Parts`)
> *"when I keep dy upwards or downwards and I hit the zenith edge or the middle of the bottom face, there is still a difference vs. scene 0 at
> tilted-pole orbit … dy or dx … create hard-to-control movements … analyze the root causes … rebuild properly"* — the owner.

**Measured first** (the same six gestures on both scenes: across and on, the same dy, a 12 px reverse then forward, a dx and back, the reverse past the
hysteresis, on): `Scene_0` held, 0 mm, 2 mm, dx along the ridge, released. `Scene_0bis` far out: the small reverse took the gizmo BACK over the ridge
(59 – 82 mm), the camera turned back, a new hold the other way; close in at the bottom, the crossing never made. Four causes:
1. **The hysteresis on the surface** (§8's depth, true only close in) — far out a finger mm is ~9 mm of surface: released by a 12 px reverse →
   `ORBIT_ANY_SHAPE.md` §8.1: **the release is the finger's** (`edgeHoldFinger`, `edgeHoldMm` of finger the other way), one rule for every hold.
2. **The side read late** — the shown direction at the PIECE's angles (its spring): the crossing a frame after the gizmo, 14 – 30 mm past the ridge →
   **the shown rule at the ORBIT's own angles** (`dirAt(st, st.orbit.yaw, st.orbit.elevation)`). ⛔ Tried the same day: the orbit's bare direction —
   close in the square camera turned the view over the ridge while the orbit stood 0.17° past it: no side change, no turn, no hold, the next dy mapped
   back on the turned view (the gizmo bounced between the ridge's two faces every frame). The side must be the one the camera shows.
3. **The crossing's gate on the direction's own pitch** — off the bottom face's middle the direction leans along the axis (41° toward a tip) though it
   passes UNDER it: read "round a tip", the side flipped silently (no turn, no hold), the finger's mapping with it — the gizmo bounced across the middle →
   **`overAxisPitch`**: the part of the direction SQUARE to the axis steep (≥ 60°) is a crossing (over / under the axis); under `SPIT_OVER_AXIS_MIN`
   (0.5: within 30° of the axis — round a tip) the side changes silently, and **a crossing's hold ends there** (the edge it held is left round the body).
4. **A dx only** (the held second touch's) zeroed the MAPPED pitch — in a spit seen from above that is the finger's dx → the finger's own dy zeroed
   before the mapping, the mapped one kept.
**Probed after** (the same gestures): `Scene_0bis` close in at the top = `Scene_0` (held, 0, 2 mm, dx along the ridge at its height, released); close in
at the bottom the crossing at the bottom face's FAR edge (z 0.2992 — `Scene_0`'s 0.2995; the square camera faces the bottom face: no crossing at its
middle close in, as on `Scene_0`); far out, top and bottom: held, 0 mm, 18 – 19 mm on the small reverse (no crossing back), released by the reverse, the
next crossing held again (no bounce at the middle). ⚠ Far out a dx after the crossing runs along the axis to a tip (the zone's pole) — the side changes
silently there and the hold ends (`Scene_0`'s ridge ends at the end cap instead).
**Vectors**: `polar_zone.test.ts` (`overAxisPitch`: under the axis, the walk's 41° case, round a tip, level beside it; the wiring), the pins.

## 5. Open, not decided by this spec
* The bend on a LARGE face inside a zone: the cap's I12 (a radial red bends at the cap's rim) for P− on a flat face.
* Several zones with crossing axes in one assembly (one frame at a time; a transition at each rim).
* The concave cases (a fan inside a recess) — §1.6's obstacles still bind; out of scope.

## 6. The owner's decisions (2026-11-13)

| | question | decided |
|---|---|---|
| D-Z1 | thresholds | valence **≥ 5**; `S_min` **0.22 × the smallest side of the PLACED set's box**, recomputed at each seat (⛔ not the piece's width — stacks; ⛔ not the finished assembly); `L_min`, `θ_max` sliders, **off** |
| D-Z2 | the axis | **from the fan's geometry, snapped within 10°**; the author's tag wins |
| D-Z3 | S2's camera (R4) | **R4 KEPT** (the owner, against the proposal to relax it): `Scene_0`'s dy hold — dy toward the turn-over held until reversed past the hysteresis, dy back and dx free |
| D-Z4 | a facet failing T2 / T3 with no pole | **joins a zone it touches, otherwise stays tilted**; fixed in Blender |
| D-Z5 | the extent of F | **the zone only, the whole assembly when the zone (+ facets alike in F) is over half the contour's area**; the author's tag forces |
| D-Z6 | the orientation bounds | **≤ 30° S1, ≥ 60° S2, between by tag, untagged S1** |
| D-Z7 | the transitions | **today's timed turn and blend; `zoneExitMm` 10 mm to leave** |

The illustrated page the owner decided from: claude.ai/artifact/ThMWwMGgrtvucdm7vtVZCq.

## Sources
Lino & Christie, *Efficient Composition for Virtual Camera Control*, SCA 2012 (irisa.fr/mimetic/GENS/mchristi/Publications/2012/LC12.html) and
*Intuitive and Efficient Camera Control with the Toric Space*, SIGGRAPH 2015 (doi 10.1145/2766965) · Gleicher & Witkin, *Through-the-Lens Camera
Control*, SIGGRAPH 1992 (graphics.cs.wisc.edu/Papers/1992/GW92/camera.pdf) · Christie, Olivier & Normand, *Camera Control in Computer Graphics*, CGF 2008
· Oskam et al., *Visibility Transition Planning for Dynamic Camera Control*, SCA 2009 (§4.6) ·
Hanson & Wernert, *Constrained 3D Navigation with 2D Controllers*, IEEE Vis 1997 (homes.luddy.indiana.edu/hansona/papers/vis97.pdf) · Crane, Desbrun,
Schröder, *Trivial Connections on Discrete Surfaces*, CGF 2010 (geometry.caltech.edu/pubs/CDS10.pdf) · Ray, Vallet, Li, Lévy, *N-Symmetry Direction Field
Design*, TOG 2008 (hal inria-00331900) · Bommes et al., *Quad-Mesh Generation and Processing: A Survey*, CGF 2013 · the Blender manual, *Mesh Structure*
(poles, loops) and *Bevel* (the intersection types) · Peters & Reif, subdivision at extraordinary vertices (SIAM J. Numer. Anal. 1998).
The measurements (scratchpad, this session): `tip_map.ts` (the map sampled), `axis_x.ts` (the map in F), `curv.ts` (valence, defect, size),
`walk_tip.mjs` (per region); the recordings `bis_tips`, `bis_any`, `s0_tips`, `s0_any`.
