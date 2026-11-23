# P2 DRIVES THE GIZMO — the landing map at the gizmo, the footprint support re-expressed on it (package S4, designed 2026-11-23)

> **STATUS** · ⭐ **DESIGNED 2026-11-23** on his word *"Do as per your recommendation"* (S3's finding: `mouthHoldDomain` stays 2, the build list's
> item 4 next — `ORBIT_SURFACE.md` §6 (4)). The rules are his of 2026-11-16 (P2, ⑤, Q2, Q10) and 2026-11-23 (*"Keep as held"*); the choices they leave
> open are made in §8 and may be reversed on his look. ⭐ **BUILT AND GATED 2026-11-23** (`54e37d03` + fix round 1 `19fa42bf`, §9bis – §10): G0 green;
> G1 his four records at 0 IDENTICAL to `3b7a479`; G2 a key change ~4 ms on this PC; G3 his front record: the gizmo moved on the top only (round
> `Piece44`, +73.25 mm at the recess), the camera ≤ 2.9 mm, the piece ≤ 7.1 mm (F17); the audit: two defects, fixed. ⭐ **DEPLOYED 2026-11-23** on his word *"Deploy"* (LIVE main `86a0e53` = `664f9c53`); his look
> OWED. Branch `1.0.158from1.0.157-Orbit_surface`, worktree `../orbit_surface`.
> **OWNS** · S4's design: where P2 drives the gizmo and the piece's support, what it reads, what stays, its switch, its vectors and gates.
> **READ WITH** · [ORBIT_SURFACE.md](ORBIT_SURFACE.md) §2.2 P1, P2 (its ⑤), §5.2, §6; [ORBIT_SURFACE_READOUT.md](ORBIT_SURFACE_READOUT.md) §3, §14;
> [ORBIT_SURFACE_MOUTH_HOLD.md](ORBIT_SURFACE_MOUTH_HOLD.md) §7; [ORBIT_SURFACE_BUILD.md](ORBIT_SURFACE_BUILD.md) §9 (the terms the closed orbit sets).
> Code read on `2bf0c9d6`.

## 1. In one paragraph

The build list's item 4: *"L2 driving the gizmo, the footprint support re-expressed on it with its wall kept (a replay of `Scene_1` in contact range
against `Piece44`: unchanged)"*. The gizmo's depth becomes P2's — where the held piece, AS HELD, moved along the facet's normal first touches the
placed parts — read FROM WHERE THE PIECE IS (⑤): far out the piece is outside every part, so that is the reading from outside; close in a part
standing above the piece is a WALL, never a step up. The footprint support (the piece's height close in) becomes the same reading, so the gizmo and
the piece read ONE rule (P2 makes (a) = (b), `ORBIT_SURFACE.md` §2.2). Behind one switch; at 0, the build as deployed (`e80a7b0`) frame for frame.

## 2. The rules it implements (decided), and one correction

* **P2** — the gizmo's depth is the first contact of the held piece moved along the facet's normal (2026-11-16, Q2: first as a readout — S2 —, then
  driving). **As held** (his word 2026-11-23, (a)): never turned onto the facet.
* **⑤** — out of contact range read from outside; IN contact range FROM WHERE THE PIECE IS: a part whose top stands above the piece is BESIDE it, a
  WALL that stops the piece, the gizmo and the camera (his Q1 (b), `CLOSE_IN_CONTACT.md` §1, §5 – §6; `footprint.ts`: *"never a step up onto it"*).
  ⛔ *"A first contact read from outside at every distance would lift a piece in contact with `Piece44` onto its top half a piece before the edge."*
* **P1** — far and medium the piece rides the shell: the gizmo's depth moves only the marker; where the direction is oblique to the face a depth
  step still shifts the far piece and the camera by h × tan θ (F17, a recorded defect of the orbit's queue) — so the camera's path is MEASURED (§7 G3).
* **Q10** — the gizmo still reads the floor of a slot the piece fits; the PIECE's drop over it is the contact's queue's (`RND8`), not this package's:
  the support's drop (eased, only where the piece fits) stays as built.
* ⭐ **THE CORRECTION — what the gizmo stands for.** The readout (S2) draws P2's ring at the piece's REFERENCE point (its resting face's centre) at
  first contact, and compares it with today's point: on a side facet, the piece as held, Δ was +22.5 / +51.8 mm everywhere (`ORBIT_SURFACE_READOUT.md`
  §14) — and the question put to him said *"a side's gizmo would stand half a piece out once P2 drives"*. ⚠ **That consequence does not hold.** The
  game's gizmo marks the CONTACT, not the reference point: the piece hangs from the gizmo by its LIFT along the shown direction (`placeAtAngles`,
  `liftOf` → `faceLift`: the piece's extent past its reference toward the gizmo — since 2026-11-05, *"the piece's support at the gizmo, not its
  resting face's centre"*). The lift along the facet's normal IS P2's reach (`heldReach`, S3). So P2 drives the gizmo at **its level LESS the
  reach** — the plane of the piece's lowest extent at first contact: on a flat face, top or side, aligned or not, exactly today's level; the piece's
  reference, hung by its lift, exactly at P2's level. His (a) stands — P2 reads the piece as held — and the stand-off he was warned of is not what
  he will see: a side's gizmo stays on the wall. The readout's ring keeps its meaning (the reference point; `ORBIT_SURFACE_READOUT.md` §14 gets a note).

**What changes on the glass** (as `ORBIT_SURFACE.md` §2.2 P2 predicted, now with the reach): over open faces nothing; within half a piece of every
wall and rim the gizmo's depth changes there, not at the wall — off `Piece44` (41 mm proud) the gizmo stays on its top ~20 mm past its edge (as the
piece already does close in); the channel's floor a landing only in its central band (S3's finding: near its walls the gizmo stays on the rims — no
drop at the tilt); the 10 mm slots never entered; the recess beside `Piece44` shows `Piece44`'s top far out (+73.3 mm, S2's G3). Close in, against
a proud part, nothing climbs: the wall as today.

## 3. The design

### 3.1 The gizmo's level

At a place on facet `f` (its outward normal `n`, in the world), `rawGizmo` computes today's point as built (the region, the cast, the bridge, the
mouth), then — the switch at 2, `Scene_1`, a piece held and not placed — reads P2 there:

`L = landingAt(place, from = F·n + SUPPORT_SLACK_M)`, where `F` is the piece's reference point solved last frame (§3.2), the piece AS HELD.

| `L` | the gizmo's point (the place's two other coordinates kept) | why |
|---|---|---|
| **land** at depth `D` | at level **`D − reach(n)`** (`heldReach`) | the contact's plane: the piece, hung by its lift, has its reference at `D` |
| **nothing** | on the facet's PLANE (`t.surface`) | §5.2 *nothing to land on* — today's bridge over a slot right through; the readout's magenta ring marks it |
| **inside** | TODAY's point | the piece at its own level would overlap a part there: a WALL beside it — the collision decides (P5), as built |
| no preparation possible (another scene, no piece, placed) | TODAY's point | — |

Its normal, host and mouth stay today's (§3.5). Pure: one function in `src/core` decides the level from `L`, the reach, the plane and today's level.

### 3.2 Where the piece is — `F`, read once a frame

`F` = the anchor the solver left last frame (`st.pieceHoldPrev.anchor`: `ringAnchorAt` at the solved angles, the ring's hold included — the
piece's resting face's centre, model coordinates), **snapshotted at the start of the frame** (`assemblyFrame`, before `supportFrame`) so every query
of the frame — the support's, the solver's 24, the sections', the frame's own gizmo — reads the same `F` (the frame's gizmo memo stays valid). None
(the first frame of an orbit): read from outside. Far and medium the piece rides the shell (≥ 60 mm off the parts' box): from `F` = from outside.
⭐ **(fix round 1, §9bis 1, 3)** the snapshot is taken FIRST in the frame (before the approach's coast) and read between frames too — a new stamp each,
the gizmo's memo valid for one; and `F` is read ONLY along the face the piece is over (last frame's shown facet, within 2.6°): "far = from outside"
held only for that face — on the others `F` stands behind the parts or between them. Every other direction: from outside.

### 3.3 The footprint support on P2 (⑤), its wall kept

`supportFrame`'s choice (`footprintSupport` — the highest part under the piece's outline whose top is not above its bottom, within the shell's
offset — and `supportTop`) becomes P2 along the gizmo's face normal `u`, from the piece's solved reference `r` (the anchor `supportFrame` already
computes): `L = landingAt(r, from = r·u + SUPPORT_SLACK_M)`.

| `L` | the support | today's rule it equals |
|---|---|---|
| **land** at `D`, `r·u − D ≤ orbitShellOffsetMm` | the part `L.part`, its level **`D − reach(u)`** | the highest part under the footprint, not above its bottom, within the window — its top |
| land farther than the window, or **nothing** | none | none |
| **inside** | today's rule (`footprintSupport`) | — (an abnormal pose: the relocation's) |

The drawn piece's support (*"a drop waits for the drawn piece too"*) the same, from the drawn reference. The level shown (`supportLevelStep`: a drop
eased, a rise at once), the drop only where the piece fits (the solver's gap), `levelRaise`, `restRaise`: as built.

Where it differs from today: only where the piece's outline overlaps a part whose top it would NOT touch first — a frustum's or the heptagon's
slanted side (P2 exact: the contact on the slant, lower; today: the part's top), a piece turned off its resting face. Over boxes, the piece resting
face down — `Piece44` — the same part and the same level (vector V3, the gate's own).

### 3.4 The preparations — on demand, by direction, cheap

A query needs the sums prepared for its direction. S2's `prepareLanding` costs 2.5 – 6.6 ms a direction (the hulls, the pairs' half-space normals
— keyed by strings —, then the projection); the readout makes one a frame at most, the facet the gizmo is on. Driving cannot wait: the solver, the
sections and the support query other facets and other normals in the same frame, and a facet read today's way until "its turn" would change depth
under the gizmo at an arbitrary frame. So:
* `src/core/landing_map.ts` splits the preparation in two, ONE code for both readers (`buildLandingMap`, `prepareLanding` bit for bit as before):
  the **direction-free** part (`prepareHeldSums`: the hulls, every pair's half-space normals and support values) once per placed set and held piece;
  the **projection** on a direction (`landingFor(sums, axes)`: four dots per half-space), per direction.
* The wiring keeps one cache keyed by the placed set and the held piece (id, points, orientation, resting face's centre — the readout's key less
  the map's identity and frame: a direction is a world direction); its entries per world direction (rounded to 1e-9), each prepared ON DEMAND the
  first time any query reads it, its axes `planeAxes(n)`. A turn of the piece, a change of resting face, a seat: the direction-free part again
  (one ~3 ms frame on this PC) and the projections as read.
* The readout (S2) is left as built (its own cache and HUD figures).

### 3.5 What stays as built

The gizmo's normal and host (today's: the facet's, or the cast's face), the mouth's flags (`stackDepthAt`) and its hold (S3); the edge blend
(`blendThroughEdges`: its endpoints are `rawGizmo`'s — P2's —, its middle the point cast as built, a known limit §4); the shell, the foot, the lift,
the solver, the calm, the camera; the readout, which reads TODAY's point (its Δ, the S3 answer unchanged — the frame's call passes it today's
`rawGizmo` result, the drive's beside it).

### 3.6 The sections' lines

Their samples are cached across frames by the shown angle and the map's options; they read the gizmo, which now depends on `F` near walls. Their
key gains the drive's signature: the held piece's key and, for each direction prepared, the parts whose first-contact top stands above `F` (a
part becomes a wall or stops being one: the lines re-sampled). Far out the signature does not change.

### 3.7 Where, and the switch

`Scene_1` only, as the readout (`READOUT_SCENE`): its parts are convex bodies as data (C4, `ORBIT_SURFACE_BUILD.md` §8 row 10). Other scenes:
today's depth. The switch **`landingDrives`** (GIZMO & SECTIONS): **0** = as built (`e80a7b0`; no P2 query is made), **1** = the support on P2
only, **2** = the support and the gizmo. Default **2** on this branch.

## 4. The obstacles and the fallbacks

| obstacle | what could go wrong | the answer |
|---|---|---|
| the gizmo reads the piece, the piece reads the gizmo | a loop within a frame | `F` from LAST frame's solve, fixed for the frame (§3.2) — as the support already reads |
| cost | 10 – 20 preparations in one frame (S2's figures: a hitch) | the direction-free part once per key, a projection per direction (§3.4); a query ~1 – 3 µs (S2's G2) — G2 here |
| a turn mid-gesture | the piece's key changes | the direction-free part again: one frame of ~3 ms on this PC (the phone's on the HUD — owed) |
| the sections' cache | lines drawn for another `F` | the drive's signature in their key (§3.6) |
| the camera's path | P2's steps half a piece from a wall shift the far piece and the camera by h × tan θ where the direction is oblique (F17) | measured on his records (G3); F17 is the orbit's queue's |
| frusta, the heptagon, a turned piece | the support's level changes (P2 exact on a slant) | stated (§3.3); G3 counts the frames |
| an edge band | its middle is today's point cast: near a wall within a band the blend may climb what P2 calls a wall | a known limit, as built (the band is ~10 mm wide each side) |
| `inside` | no landing for the piece at its level | today's point / today's support rule: the collision decides (P5) |
| `Scene_0bis`, `Scene_2` | their parts not checked as convex data | today's depth there (G1 on `Scene_0bis` at 2: identical) |

## 5. Prior art (no new mechanism)

CAM's drop cutter, which descends from the tool's own height (`from`); the configuration-space obstacle of a translating body (Lozano-Pérez 1983) —
`landing_map.ts`'s own; a guarded move. The split preparation is the textbook separation of a Minkowski sum's facet structure (direction-free) from
its support values along a query direction. No patent concern beyond S1's.

## 6. The vectors — each shown RED on a mutant first

* **V1** the level rule (`src/core`): land → `D − reach`; nothing → the plane; inside → today's; the reach's sign; a side facet, the piece as held
  (100 × 20 × 40 mm against a wall facing +x): the gizmo ON the wall (mutant: the reach left out → +50 mm).
* **V2** ⑤ — no step up: a box 41 mm proud beside the piece, `F` below its top → the place within half a piece of it reads `inside` → today's; `F`
  above its top → its top (mutant: read from outside → the gizmo onto the top).
* **V3** the support = today's over boxes: `Scene_1`'s placed boxes, the green piece face down, a grid of places round `Piece44` at heights within
  the window: the same part and level as `footprintSupport` + `supportTop` (within 1e-9 m); and on a frustum's slant P2 lower (stated).
* **V4** the split preparation: `prepareLanding` = `landingFor(prepareHeldSums(...))` bit for bit; `buildLandingMap`'s vectors unchanged.
* **V5** the switch, the menu, the wiring: at 0 no P2 query (a pin); the readout fed today's point; the lines' key.

## 7. The gates

* **G0** `npm run verify`. **G1** his four records at 0 against the `3b7a479` code's replays: identical (as S2, S3). `Scene_0bis` at 2: identical.
* **G2** the cost offline (`scripts/surface/readout_cost.ts` extended): the direction-free part, a projection, a query.
* **G3** his two `Scene_1` records at 2 against 0: the gizmo's path (frames that differ, by how much, where), the piece's and the camera's (F17's
  share), the support's part and level frame by frame (the `Piece44` gate: unchanged where it is a box). Findings → the ledger (`ORBIT_SURFACE_BUILD.md` §8).
* **An independent audit** (read only), then his look on the phone.

## 8. Decisions made here (reversible on his look)

* **D1** the gizmo at P2's level less the reach (§2's correction) — not at the reference point.
* **D2** `inside` → today's point and today's support rule (the wall as built), not the piece's own level (that could lift the piece by its
  approach distance over a wall).
* **D3** `F` = last frame's solved anchor, read once a frame.
* **D4** preparations on demand by world direction, the direction-free part shared; the readout untouched.
* **D5** the normal, host, mouth, edge blend's middle: as built.
* **D6** `Scene_1` only; `landingDrives` 0 / 1 / 2, default 2.

## 9. For his look

On `Scene_1`: (1) the top channel near its walls — the gizmo stays on the rims, no drop at the tilt (S3's finding closed); (2) off `Piece44`'s edge —
the ring stays on its top ~20 mm past the edge with the piece; (3) the 10 mm slots — never entered; (4) the sides — nothing different. The slider
`landingDrives`: 0 = as deployed. The readout's ring (if on) still marks the piece's reference point.

## 9bis. The audit (independent, read only, on `54e37d03`) and fix round 1

**Clean** (each checked with its lines): the switch's 0 (no value, identity, cache behaviour or order changed); the split preparation (the same
half-spaces in the same order, the same arithmetic: `prepareLanding`, `buildLandingMap` bit for bit; `top` the true highest depth along `n`); the
level rule (`faceLift` = max(0, `heldReach`): the piece's reference at `D + d` — no double count, no sign error, the tilted frames' levels kept);
the support (the window and the slack as before; `inside` → today's rule exactly; the drawn reference right).

**Its findings, and what was done:**

| # | finding | done |
|---|---|---|
| 1 | ⛔ DEFECT — `st.frames` advances at a frame's END, so a query between two frames (a pinch, an A + drag, the approach's coast — which ran before `landingDriveFrame`) read the gizmo UNDRIVEN (the frame check), and the gizmo memo (`GIZMO_MEMO`, keyed by the frame's number) carried that into the next frame: the support's anchor read today's gizmo, every other angle P2's | ⭐ `landingDriveFrame` FIRST in `assemblyFrame` (before the coast); between frames the stored snapshot is read (no frame check); the drive's STAMP (one a snapshot) is part of the memo's validity — a snapshot empties it |
| 2 | ⛔ DEFECT — the lines' key changed on nearly every frame of motion: every direction the lines prepared carried `F`'s level where `F` stood below its `top` — the far faces included (the piece is in front of one face only) — the lines re-sampled each frame, never refined | ⭐ with 3: only the piece's own face can carry `F` |
| 3 | ⛔ (a risk in its words; a defect for this design) P2 was read FROM `F` on EVERY face — on a face the piece is not over, `F` stands behind the parts (the back face, the piece in front: *nothing* — the gizmo on the plane over the back's channel and slots) or between two of them (a landing inside the nearer part). It reaches the lines, the edge blend's far end, the solver's queries across an edge, the map's catch-up | ⭐ §3.2 amended: read from `F` ONLY along the direction of the face the piece is over (last frame's shown facet, `asmShown`, within 2.6° — `levelOn`'s tolerance); every other direction FROM OUTSIDE (the piece reaches a face it is not over only round the contour's convex edges — from outside) |
| 4 | risk — the model's orientation follows the drawn piece every frame of a turn (an alignment is a slerp), so the direction-free sums are prepared again on every frame of a turn, not once | measured (G2); the phone's figure owed |
| 5 | nit — the support's index is the first body of its part | none: `asmSupport.index` is never read; noted |
| 6 | nit — the readout's "today's blend" blends toward the next face's DRIVEN point, and is evaluated even with the readout off | ⭐ evaluated only when the readout runs; the blend's far end stated (the `band` flag only) |
| 7 | risk — within one 0.1 mm step of `F` a sample may be stale | accepted (with 3 the key carries `F` only over a recess, the piece below a part's top) |

## 10. As built (2026-11-23, `54e37d03`)

**The files.** `src/core/landing_map.ts` — the preparation split (`formOf` + `project`; `prepareHeldSums`, `landingFor` with its `top`;
`prepareLanding` = `landingFor(prepareHeldSums(…))`, `buildLandingMap` on the same), `driveLevel`, `landingSupport`. `src/render/landing_drive.ts`
(new) — the state (`st.landingDrive`), `landingDriveFrame` (the sums by key, `F`), `driveGizmoLanding`, `driveSupport`, `driveKey`.
`src/render/assembly_wiring.ts` — `landingDriveFrame` right before `supportFrame`; `rawGizmo` = `driveGizmo(rawGizmoToday(…))`; the frame's call
keeps `mrT` (today's) for the readout and, where P2 moved the point, today's blend for its `band`; `supportOf` (twice: the solved piece, the drawn
one); the lines' `optKey` + `driveKey`. `landing_readout.ts` exports `READOUT_SCENE` and `idOf` (one constant, one place). The switch
(`gestureConfig.ts`), the menu: the surface's three switches in a subfolder **THE ORBIT'S SURFACE** of GIZMO & SECTIONS (a folder holds 9 at most —
`landingReadout` and `mouthHoldDomain` moved there with it); 138 sliders.

**Departures from §3.** (1) `Piece44` is not a box: it is the inverted frustum on Piece4's top (wide face up, its sides overhanging the goal's host).
V3 is written on a `Piece44`-like inverted frustum: above its wide top the first contact is that face (P2 = `footprintSupport` + `supportTop`); beside
it, the piece (48 mm) lower than its wide top meets the overhang — `inside`, today's rule — so the support is today's there too (§3.3's "over boxes" was
too narrow: what matters is a part's widest extent at its top). (2) The lines' key carries, per direction prepared, "o" when `F` is above the
direction's `top` (the reading from outside) else `F`'s level (0.1 mm).

**The vectors** (`tests/landing_drive.test.ts`, 17), each RED on its mutant first — one mutant at a time on the built code, the file run, reverted:

| mutant | red on |
|---|---|
| the reach left out (`driveLevel`) | V1: *"expected 50 to be close to +0"* (the side, as held), *"expected 0.3 to be close to 0.25"* |
| nothing read as today | V1: *"expected 0.2 to be 0.4"* |
| the support read from outside (`driveSupport`) | V5: *"expected { kind: 'land', part: 'P' } to deeply equal { kind: 'today' }"* (beside the proud box, low) |
| the gizmo read from outside (`driveGizmoLanding`) | V5: *"expected 'land' to be 'inside'"* |
| `top` without the held piece | V4: *"expected { kind: 'inside' } to deeply equal { kind: 'land', … }"* (3 tests) |
| any scene | V5: *"expected { … } to be null"* |
| the window dropped (`landingSupport`) | V3: *"expected 'land' to be 'none'"* |
| `F` read on any frame | V5: *"expected { … } to be null"* |
| `F` read after the support | V5 (the wiring): *"expected 41256 to be less than 41232"* |

Pins amended (the code they pin changed on purpose): `footprint.test.ts`, `slide_rebuild.test.ts` (the support through `supportOf`),
`landing_readout_switch.test.ts` (the frame's call; the drive imports the readout's module), `mouth_hold_domain.test.ts` (the call; the subfolder),
`menu_layout.test.ts` (the subfolder, 138). **G0** `npm run verify`: 192 files / 2377 tests.

**Fix round 1** (`19fa42bf`, §9bis): each change's vector RED on its mutant first — `F` read on every face (*"expected { kind: 'nothing' } to deeply
equal { kind: 'land', … }"*: the bottom face, the piece above); the stamp not advanced (*"expected +0 to be 1"*); the drive's step after the coast
(*"expected 41315 to be less than 41189"*); the memo without the stamp (its pin). **G0**: 192 files / 2378 tests.

**G1 — identity: PASSED, bit for bit.** His four records of 2026-11-22 replayed from the worktree at `landingDrives` 0 (the kit's
`fo3/surface/drive/run_s4.sh`, `run_s4f.sh`; the walker `walk_dr.mjs` = `walk_mh.mjs` + the support's level, the piece's place) against the `3b7a479`
code's replays: the largest difference **0** on every frame — on `54e37d03` and again on `19fa42bf` (`Scene_1` back 2 916 frames, front 6 034;
`Scene_0bis` back 5 011, front 8 381). `Scene_0bis` at 2 (on `54e37d03`): identical too (the scene's restriction). No probe profile left in %TEMP%.

**G2 — the cost** (`scripts/surface/drive_cost.ts`, offline, `Scene_1`'s 36 boxes, the green piece as held): the direction-free sums **3.7 ms**
(median; 5 ms cold); a direction's projection **0.05 – 0.13 ms**; a query **~1 µs** (0.7 – 1.5). A key change — a pick-up, a seat, ⚠ every frame of a
turn (§9bis 4: an alignment is a slerp) — ~4 ms on this PC. The phone's figure owed.

**G3 — on his records, 2 against 0** (the kit's `rd_s4.mjs`). Back record: nothing moved (> 1 µm: 0 frames). Front record: the gizmo on **2 444** of
6 034 frames, all on the top — round `Piece44` and over the recess beside it (the largest **+73.25 mm**, as S2's readout measured: +73.3); the
camera's position on 2 273 frames, at most **2.9 mm** (its target never); the piece on 2 278, at most **7.1 mm** — F17's share (far out, the
direction oblique to the face: h × tan θ), the orbit's queue's. **The support was never active in his records** (they never come close in): the
`Piece44` gate rests on V3 — his look close in round `Piece44` owed.

**Known limits.** L1 — at the frame's previous angles the gizmo memo's shortcut returns last frame's gizmo (`st.asmG`, read with last frame's `F`): one
frame's lag, as the map's own. L2 — a turn's frames each prepare the sums (G2); a cache of the placed parts' hulls apart from the held piece's would
roughly halve it — not built. L3 — the readout's `band` flag reads a blend whose far end is the next face's driven point (the flag only). L4 — the
support's index is its part's first body (never read). L5 — an edge band's middle is today's point cast (§3.5). L6 — the contact-range behaviour is
proven by vectors only (V2, V3), not on a record.

