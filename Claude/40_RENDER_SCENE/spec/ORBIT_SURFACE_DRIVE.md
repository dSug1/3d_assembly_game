# P2 DRIVES THE GIZMO — the landing map at the gizmo, the footprint support re-expressed on it (package S4, designed 2026-11-23)

> **STATUS** · ⭐ **DESIGNED 2026-11-23** on his word *"Do as per your recommendation"* (S3's finding: `mouthHoldDomain` stays 2, the build list's
> item 4 next — `ORBIT_SURFACE.md` §6 (4)). The rules are his of 2026-11-16 (P2, ⑤, Q2, Q10) and 2026-11-23 (*"Keep as held"*); the choices they leave
> open are made in §8 and may be reversed on his look. Built on branch `1.0.158from1.0.157-Orbit_surface`, worktree `../orbit_surface`.
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

## 10. As built

(filled by the build)
