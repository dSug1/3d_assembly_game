# Green piece — the assembly phases (prototype spec, draft 5)

**Status:** draft 5, 2026-10-04. Not built — ⛔ **build only when the owner says so**, step by step (§6). Prototype branch only
(`1.0.59m-…`), not the main line. Marked **AGREED** where the owner confirmed it.

⚠⚠ **ON HOLD — ITS GROUND MOVED (2026-10-05).** Steps 1–2 were built on `1.0.59n-` and that branch was set aside by the owner (*"not
satisfied"*); `1.0.59o-` likewise. From `1.0.59p-` on, the green piece's snapped rotation, the face tracking, the "held" latch and its
behaviours (the contour, the yaw share, the cross deadband), the pink face's normal and the guide sphere were **REMOVED** — this spec's
coarse / commit stages read several of them. The orbited piece's orientation is now the RESTING FACE's (`RESTING_FACE.md`) and its
alignment a second-finger tap while orbiting (`RESTING_FACE_ALIGNMENT.md`). ⛔ Re-read against those two before building any step here.

**Goal:** make the green piece follow the way a child assembles two bricks: pick the face → commit by bringing it toward the target →
approach along the insertion axis while rolling the long axis into line → hover → fine roll → contact → seat.

## 1. Scope (AGREED, draft 4)

- **No hold is needed any more** (the owner, 2026-10-04: *"no need for the green piece to be held for orbit. Orbiting by pressing
  anywhere (except on seated parts) applies"*). A press on a seated / placed part keeps today's behaviour: it moves the pink gizmo there
  and recomputes the pink face.
- **Which green piece the approach applies to** is decided LATER (*"we will later define how to pick up the green piece to which the
  approach is applied"*) — see §8, written at the end of the approach's build.
- **Target:** the pink ring. `T` = its centre, `n` = the pink face's outward normal. The **insertion axis** is the line through `T`
  along `n`.
- **The green piece's pose:** TUMBLED, as booted (`Scene_1` (1,2,3,4)); no level-out (`greenLevelOutOn` 0) — *"the alignment on gravity
  shall be the user's own action, not a game compute"*. The old step 0 (rounding the heading to the pink face) is REMOVED: there is no
  level-out, and the snapped rotation turns the tumbled piece.
- **The "held" behaviours** (the 0.4 yaw gain share, the cross deadband, the snap cap) apply WHENEVER the snapped rotation is active;
  the whole-piece white contour is replaced by the white highlight of the SELECTED face.
- The green piece stays a display proxy, with no collision and no goal. "Contact" and "seat" come from its own hull against the pink
  face's plane and extent.

## 2. Quantities

| Name | Meaning |
|---|---|
| `d` | the green piece's distance to the pink gizmo `T` |
| `w` | the **coarse push**: the DEADBANDED dy accumulated since the reference moment — the press that selects a face, else the LAST press outside a seated piece (AGREED; EVERY new press resets `w` to 0) — in mm, signed so that **toward `T` is positive** (the sign of dy that reduces `d` at that moment, kept until the next reference). Monotone and finger-proportional, whatever the rings do |
| `d_coarseMin` | the distance under which `COARSE` and the commits are OFF (§3.2) — computed once at boot from the orbit rings |
| `F` | the **selected face** (pressed, white), or none |
| `M` | the **mating face**, latched by a commit |
| `P_c` | the green piece's position at the forward commit |
| `S` | the **standoff point**: `T + n · (standoffM + h)`, `h` the green piece's half-depth along `n` |
| `u` | the **push**: the DEADBANDED dy accumulated since the forward commit, mm (toward `T` positive), ≥ 0 |
| `p` | approach progress: `clamp(u ÷ greenPushTravelMm, 0, 1)` — 0 at `P_c`, 1 at `S` |

## 3. Phases

### 3.1 Selection (AGREED)

- **A press on a face of the green piece selects it** (`F`), highlighted in WHITE. (The press still orbits, as anywhere.)
- **A double tap on the green piece unselects** (`F` = none), if one is selected. It does NOT reset the camera (the green piece is
  exempted from the empty-space double tap) and it COUNTS as an episode.

### 3.2 `COARSE` and the commits (AGREED; thresholds on the coarse push `w`)

| State | dx | dy | Rotation | Transitions |
|---|---|---|---|---|
| `COARSE`, `w < snapOff` (6 mm) | orbit yaw + the **snapped rotation** (as today) | orbit ring | snaps on the grid, from the tumbled pose | `w ≥ 6` → snaps OFF (orbit only); `w ≥ 10` → commit forward; `w ≤ −6` → commit backward |
| `COARSE`, `w ≥ snapOff` | orbit yaw only | orbit ring | none | `w < 6` → snaps on; `w ≥ 10` → commit forward |
| **commit forward** (`w ≥ commitFwd`, 10 mm) | — | — | the face (`F`, or if none **the face closest to the pink gizmo**, §3.4) eases onto exact anti-parallel with `n` | latches it as `M`; → `APPROACH`; no snapped rotation |
| **commit backward** (`w ≤ −commitBack`, −6 mm) | — | — | the face OPPOSITE `F` turns to face the pink face (its normal anti-parallel to `n`); it becomes `F`, highlighted | latches it as `M`; no snapped rotation until `w` reaches the forward commit (10, a forward commit of that face) and then comes back below 6 |
| un-commit (`w` back below `snapOff`, 6) | — | — | **the quaternion is KEPT** (*"keep the quaternion at crossing backwards"*) | → `COARSE`, snapped rotation from that pose |

- **The thresholds are on `w`, not on a distance ratio** (the owner, 2026-10-04: *"I agree with your recommendation: keep your three
  thresholds and their order, but measure them on a monotone, finger-proportional coordinate"*). `r = d ÷ d_ref` is DROPPED: along the
  waist profile its ±3–5 % bands were 0.4–2 mm of finger (under one deadband), and past the waist pushing "toward" made it grow again.
  `w` counts only deadbanded travel, so each threshold sits at least one deadband (3.5 mm) beyond the press, and the bands between them
  (snap-off 6 ↔ forward 10: 4 mm; 6 ↔ −6: 12 mm) are wider than the measured noise (0.761 mm) many times over.
- **The quaternion at a crossing back below 6 mm is conserved**: the snaps resume from the pose as it is (the settle and any roll included).
- **The outer ring:** `w` keeps counting even where the orbit is at the rings' end, so the backward commit is always reachable. The owner's
  *"increase momentarily the radius of the ring"* is KEPT as VISUAL feedback: at the rings' maximum radius, a pull away moves the green
  piece outward by up to the distance the backward commit's travel would give, and back as `w` returns.
- **The minimum distance `d_coarseMin`** (the owner, 2026-10-04: *"there is a min distance d under which this is not possible any longer
  based on orbit radius/height configuration and this should toggle off the coarse and commit (in any case, we should already be in the
  approach phase at this distance)"*). Toward the waist the rings bring the green piece closest to `T`, and past the waist "toward"
  reverses; so near the waist there is no room left for the forward commit's 10 mm. `d_coarseMin` = the distance `d` at the ring position
  where the dy travel remaining to the waist (the rings' closest point) equals `commitFwd` — the larger of the two sides of the waist.
  Below it, `COARSE` and the commits are OFF (the orbit only) until `d` is back above it. ⭐ **Computed ONCE at boot**, and again only when
  a tuning slider changes the orbit rings (radius, height, the 4th ring), the elevation gains, or `commitFwd` — never every frame; it is
  fixed at the game's finalization.

### 3.3 After the commit: `APPROACH` → `SEATED`

| Phase | Entry | dx | dy (toward `T` positive) | Rotation | Camera |
|---|---|---|---|---|---|
| `APPROACH` | committed, `p < 1` | nothing until the lines show; then **roll** about `n` (§3b) | **pushes** along the funnel (*"After the commit, dy pushes the green piece towards pink gizmo"*); at `p = 0`, a pull moves the orbit ring again (`w` falls → un-commit below 6 mm) | `M` locked; roll only | as built today (Q3.3) |
| `STANDOFF` | `p = 1` | roll (fine by now) | a further push → `CONTACT`; a pull → `APPROACH` | roll only | as built today |
| `CONTACT` | `M` touches the pink face's plane | slide along the face's first in-plane axis | slide along the second | roll only | as built today |
| `SEATED` | in `CONTACT`: lateral offset < `captureOffsetMm` (on the glass), roll error < `snapConeDeg` | — | — | lerped onto the exact seat | as built today |

**The funnel (AGREED):** `G(p) = S + axial(P_c − S)·(1 − p) + lateral(P_c − S)·(1 − p)²` — the axial part linear, the lateral part
(perpendicular to `n`) quadratic, so the piece lines up with the axis before it arrives. The user never steers laterally.

**Feedback:** a short vibration on entering `CONTACT`; at `SEATED` a vibration and a pop-up like the goal's (Android
`navigator.vibrate`; iOS has none).

### 3.4 Which face a commit takes (AGREED)

- **Forward:** `F` if selected; if nothing is selected, **the face closest to the pink gizmo at the commit** (*"the face which is closest
  to pink gizmo at commit gets commited"*): **the face whose normal points most AGAINST the pink face's normal** (the owner, Q2.1).
- **Backward:** the face opposite `F`. With nothing selected: **the face whose normal ALIGNS most with the pink face's normal** (the
  owner, Q2.2) — the one pointing away from the target — turned to face it.
- **The settle** (AGREED from draft 3): the turn that makes the face exactly anti-parallel is the smallest one, eased over one snap
  duration (`greenSnapEaseMs`) — a correction, not a choice made for the user.

### 3b. The roll: long axis, then fine (AGREED)

Long-axis alignment is a **deliberate** action (*"not something the game automatically does"*); a tap was rejected (*"it has to be a
more precise action"*): dx is that action.

**Long axis:** the longest in-plane direction of a MATING face (not of the whole body).
- Green piece (103.5 × 41.25 × 45 mm): body long axis its own x (2.3× the next); its other two sides almost equal (41 / 45 mm).
- Piece 10 (190 × 241 × 30 mm): its big face (190 × 241), long axis the painting's vertical, only 1.27× the width.

**The control:**
1. **The lines** (pink on the pink face's long axis, green on `M`'s) appear once `p ≥ greenLongAxisFromP` (**0.2**), hide below it
   minus `greenLongAxisHysteresisP` (0.05). The roll starts with the lines.
2. **dx rolls** the piece about `n`, freely through 360°; rolling 180° further chooses the other parallel orientation.
3. **The gain falls with progress**, coarse far, fine near: `rollDegPerMm(p) = coarse · (1 − p) + fine · p` — one control, no mode switch.
4. **The long-axis magnet:** within `greenLongAxisMagnetDeg` of a long-axis alignment the roll settles onto it; dx beyond it leaves.
5. A face with no clear long axis (sides within `greenLongAxisMinRatio`) draws no line and has no magnet: the roll is fine-only.

### 3c. Deadbands and thresholds (AGREED)

**The base** (unchanged): §1.1's per-axis deadband `motionDeadbandMm` **3.5 mm** (4.6 × the measured pointer noise, 0.761 mm), widened
× `orbitCrossDeadbandFactor` **3** on one axis while the other moves (10.5 mm). Only deadbanded travel moves the orbit, `w`, `u` or the roll.

**The coarse thresholds on `w`** (deadbanded dy since the reference, toward `T` positive):

| Threshold | Default | Finger travel straight up/down (from rest) | With dx moving |
|---|---|---|---|
| `greenSnapOffMm` — snaps off at `w ≥`; un-commit below | **6** | 3.5 + 6 = **9.5 mm** | 10.5 + 6 = **16.5 mm** |
| `greenCommitFwdMm` — commit forward at `w ≥` | **10** | 3.5 + 10 = **13.5 mm** | 10.5 + 10 = **20.5 mm** |
| `greenCommitBackMm` — commit backward at `w ≤ −` | **6** | 3.5 + 6 = **9.5 mm** away | 10.5 + 6 = **16.5 mm** |

- The order is the owner's (snaps off before the forward commit; the backward commit the other way); the numbers are a first proposal,
  tuned on the glass. A sideways swipe cannot commit: its dy needs the widened band plus the threshold.
- **The approach push `u`** (after the forward commit) is the same deadbanded dy, counted from the commit; `p = u ÷ greenPushTravelMm`.

**The roll after the lines** (dx): deadbanded dx (10.5 mm while dy moves, so a push does not roll), the gain falling with `p`, the
long-axis magnet holding an alignment.

## 4. Tunables (sliders in OBJECT ROTATION › GREEN PIECE ROTATION)

| Key | Default | Note |
|---|---|---|
| `greenSnapOffMm` | 6 | `w` at which the snapped rotation turns off; below it an un-commit (§3.2) |
| `greenCommitFwdMm` | 10 | `w` of the forward commit |
| `greenCommitBackMm` | 6 | `−w` of the backward commit |
| `greenPushTravelMm` | 40 | deadbanded dy from the commit to the standoff |
| `greenStandoffM` | 0.01 | hover gap above the pink face, metres (world) |
| `greenRollCoarseDegPerMm` | 3.0 | roll at `p = 0` |
| `greenRollFineDegPerMm` | 0.5 | roll at the standoff |
| `greenLongAxisFromP` | 0.2 | the lines (and the roll) from this progress |
| `greenLongAxisHysteresisP` | 0.05 | the lines hide below `greenLongAxisFromP` minus this |
| `greenLongAxisMagnetDeg` | 5 | the long-axis magnet's reach |
| `greenLongAxisMinRatio` | 1.1 | below it a face has no long axis |
| `captureOffsetMm`, `snapConeDeg` | 10, 15° | reused: the seat's lateral and roll tolerance |

`d_coarseMin` (§3.2) is computed at boot and recomputed only when a slider changes the orbit rings, the elevation gains or `greenCommitFwdMm` — never every frame.

## 5. HUD

On the `green` line: `phase COARSE w=+4.1 mm (off 6 · fwd 10 · back −6) d=1.84 m (coarse ≥ 0.31 m) F=f3 M=— snaps on · u=… p=… roll=…°`.

## 6. Build order (each with vectors, pure in `src/input/`), with the questions each step needs answered

⛔ **Do not build until the owner says so** — *"I will answer them as we build the respective steps"*.

**Step 1. Selection** (§3.1): the press on a face selects it (white), the double tap unselects (no camera reset; an episode); `w` tracked
from the reference; the HUD. — no open question.

**Step 2. `COARSE` and the commits** (§3.2, §3.4): `w` and its sign, the snaps off at 6 mm, the forward commit at 10 (the settle, the
latch), the backward commit at −6 (the opposite face), the un-commit keeping the quaternion, the outer-ring visual extension,
`d_coarseMin` (at boot, and on an orbit tuning change), the three sliders.
- ~~Q2.1~~ ANSWERED: "closest" = the face whose normal points most against the pink face's normal.
- ~~Q2.2~~ ANSWERED: a backward commit with nothing selected takes the face whose normal aligns most with the pink face's normal.
- ~~Q2.3~~ ANSWERED (the owner, 2026-10-04: *"Yes to both"*): with nothing selected, the reference is the last press outside a seated
  piece; and EVERY new press resets `w` to 0.

**Step 3. The approach funnel and the standoff** (§3.3).
- ~~Q3.1~~ ANSWERED (*"the funnel shall route towards the pink gizmo. At one point the green piece will be blocked (when we later
  implement collision on green piece). We will manage that later on"*): the funnel always routes toward the gizmo, from either side;
  the blocking comes with the green piece's collision, later.
- ~~Q3.2~~ ANSWERED: on a lift mid-approach the piece STAYS where it is, its quaternion unchanged; a new press starts `COARSE` and the
  commits again from that distance (`w` reset to 0). To settle while building step 3: how the orbit then carries a piece that sits off
  the rings.
- ~~Q3.3~~ ANSWERED: the camera as built today, from the commit on too (*"no change vs. current build. We will later finetune"*).

**Step 4. The roll** (§3b): the gain schedule, then the long-axis lines and the magnet. — no open question.

**Step 5. Contact and slide.** — no open question.

**Step 6. Seat, with vibration and pop-up.** — no open question.

**Step 7. §8 written:** how the green piece the approach applies to is picked up.

## 7. Settled, and later

**Settled:** no hold; orbit by pressing anywhere except seated parts (a press on those moves the pink gizmo, as built); the tumbled
pose, no level-out, no step 0; selection by press, unselect by double tap; commits on the deadbanded push `w` (forward 10 mm, backward −6, snaps off / un-commit 6),
`d_coarseMin` below which they are off, keeping the quaternion; dy pushes after the commit; the settle; the roll (§3b); the deadband base; no axis latch; no
second finger and no lift during the motion.

**Later, not in this spec:** the second touch as the "dominant hand".

## 8. Picking up the green piece (to be written at the end of the approach's build)
