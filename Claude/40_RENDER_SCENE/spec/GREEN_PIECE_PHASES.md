# Green piece — the assembly phases (prototype spec, draft 3 — agreed)

**Status:** draft 3, **agreed by the owner** 2026-10-03 (*"I am OK with this proposal"*). Not built. Prototype branch only (`1.0.59k-…`), not the main line, which already has world-coordinate
translation. Marked **AGREED** where the owner confirmed it, **PROPOSED** where it still needs the owner's yes.

**Goal:** make the held green piece follow the way a child assembles two bricks: pick the face → commit → approach along the insertion
axis while rolling the long axis into line → hover → fine roll → contact → seat. Each phase frees only the degrees of freedom it needs.

## 0. FIRST — the start pose: the heading rounded to the pink face (PROPOSED; worked on first)

The owner, 2026-10-03: *"capture your suggestion as the first point of the specification. we will work on that first"*.

**The problem, measured from the code.** When the snapped turn starts, the start pose `q0` is made LEVEL (`levelHeading`): the piece's
tilt and roll are dropped, its HEADING (the direction of its own x across the floor) is kept. The snaps are then
`Pitch(β) · Yaw(α) · q0`, α and β multiples of the increment (90° for the frustum) counted from that heading, not from the pink face.
- The faces themselves (`topologyFromMesh` → `pieceFaces`, in the piece's own frame) and their counts (`scrollIncrements`: 4 and 4
  for the frustum) do not depend on the start quaternion.
- But with an arbitrary heading ψ, every yaw snap shows the pink face a side that is off by `ψ mod 90°`, on top of the side's own slant.
  At ψ ≈ 45° the piece faces the pink face EDGE-FIRST, between two sides, on every yaw snap; the commit's settle (§3a) would then be a
  turn of up to 45° plus the slant, not a small correction, and choosing a face in `COARSE` would be hard.

**The rule.** When the snapped turn's start pose is made (`q0`, once per session), its heading is also **rounded to the grid relative to
the pink face**: after the level-out, the yaw (at most half an increment, ≤ 45° for the frustum) that turns the start face's
horizontal normal to face exactly against the pink face's horizontal normal. The start face is the one most anti-aligned with the pink
normal (`mostAntiAligned`, as today).
- Applied once, with the level-out, and EASED like it (the snap duration). Automatic, like the level-out: it chooses no face for the
  user, it only squares the grid onto the pink face.
- Then every yaw snap shows a side SQUARELY (only its own slant left: 15° or 32° on the frustum), and the settle at the commit stays
  the small correction §3a describes.
- A vertical pink normal (no horizontal part): no rounding (the heading is kept as today).

**Open questions — answered when step 0 is built (§6):**
- **Q0.1 A pink face changed during the session.** Today the start pose and the pitch axis are frozen at the first start. Should the
  rounding (and the pitch axis) be redone for the new pink face?
- **Q0.2 A pink face facing up or down.** Its normal has no horizontal part, so the start face is the TOP or the BOTTOM. Does that case
  need its own rounding about the vertical (squaring the piece's sides onto the pink face's edges), or nothing?

## 1. Scope

- Applies only while the green piece is **held for orbit** (`greenHeldForOrbit`). Not held: the orbit as today, phase `FREE`.
- **Target:** the pink ring. `T` = its centre (the yellow target), `n` = the pink face's outward normal. The **insertion axis** is the
  line through `T` along `n`.
- **Mating face:** the green face shown toward the pink face, chosen in `COARSE`.
- The green piece stays a display proxy, with no collision and no goal. "Contact" and "seat" come from its own hull against the pink
  face's plane and extent.

## 2. Quantities

| Name | Meaning |
|---|---|
| `P₀` | green piece position at the press (on the orbit surface) |
| `r₀` | `|P₀ − T|`, already stored as `greenPressRadialM` |
| `S` | the **standoff point**: `T + n · (standoffM + h)`, where `h` is the green piece's half-depth along `n` |
| `u` | the **push**: the DEADBANDED dy accumulated since the press, mm (finger up positive), never below 0 (§3c) |
| `p` | approach progress: `clamp((u − greenCommitMm) ÷ greenPushTravelMm, 0, 1)` — 0 until the commit, 1 at `S` |
| `G` | green piece position |

## 3. Phases

| Phase | Entry | dx | dy (finger up = toward target) | Rotation | Camera |
|---|---|---|---|---|---|
| `FREE` | not held | orbit yaw (full gain) | orbit ring | none | follows |
| `COARSE` | press on the piece | orbit yaw + the snapped face turn (90° grid) | builds `u`; the pink ring fills as a commit meter; `u ≥ greenCommitMm` → `COMMIT` | grid snaps, **predictable** | follows |
| `COMMIT` | `u ≥ greenCommitMm` (§3c) | — | — | **settle**: the chosen face eases onto exact anti-parallel (§3a) | holds |
| `APPROACH` | committed, `p < 1` | nothing until the lines show; then **roll** about `n` (§3b) | push / pull along the funnel; a pull below `greenUncommitMm` → un-commit | face locked; roll only | holds, keeps the piece in view |
| `STANDOFF` | `p = 1` | roll (fine by now) | a further push → `CONTACT`; a pull → `APPROACH` | roll only | holds |
| `CONTACT` | the mating face touches the pink face's plane | slide along the face's first in-plane axis | slide along the second | roll only | holds |
| `SEATED` | in `CONTACT`: lateral offset < `captureOffsetMm` (on the glass), roll error < `snapConeDeg` | — | — | lerped onto the exact seat | holds |

**The funnel (AGREED):** `G(p) = S + axial(P₀ − S)·(1 − p) + lateral(P₀ − S)·(1 − p)²`. The axial part closes linearly. The lateral part
(perpendicular to `n`) closes quadratically, so the piece lines up with the axis before it arrives. The user never steers laterally.

**Backing out (no lift, no other finger — the owner: *"the kid does not release the part during the motion"*):** a pull reduces `u`,
back along the funnel through `STANDOFF` to `APPROACH`, to `p = 0` at the commit point, and further down. Below `greenUncommitMm` the
commit is undone (§3c): the piece eases back to **the exact quaternion it had on the snap grid before the commit** — the settle and the
roll DROPPED (the owner: *"if the roll of the long axis is brought back into the snapped rotation, this will create a very difficult
quaternion for the user to understand"*) — and the phase is `COARSE` again, its snaps continuing from that pose. While committed, dx
neither orbits nor advances the snaps, so that pose is exactly the one left. `CONTACT` is left only by the lift, because dy slides there.

**Lift before `SEATED`:** the piece eases back to its orbit position, and the phase becomes `FREE`.

**Feedback:** a short vibration on entering `CONTACT`; at `SEATED` a vibration and a pop-up like the goal's. Vibration only where
supported (Android `navigator.vibrate`; iOS has none).

### 3a. `COMMIT`: the face settles onto exact anti-parallel (AGREED)

The owner, 2026-10-03: *"I prefer to keep the 90 degrees rotation (or whatever the angle is based on the green piece geometry) and then
find a way to anti-align the normals"*. ⛔ The exact face targets (`cycleTargets`) are rejected for `COARSE` (*"very difficult for the
user to predict which face will show at next snap"*).

- `COARSE` snaps on its grid. Because the frustum's sides are slanted (32° and 15°), the face shown is off anti-parallel by that slant.
- **At the commit** (the first push beyond the deadband), the shown face eases onto exact anti-parallel with `n`: the smallest turn,
  over one snap duration (`greenSnapEaseMs`). The face does not change, only its slant. It is a correction like the seat's magnet, not
  a choice made for the user.
- **Optional preview** (`greenSettlePreviewMs`, 0 = off): in `COARSE`, once dx has rested that long, the shown face settles the same way,
  and goes back to the grid as soon as dx moves. The next snap is still computed on the grid.

### 3b. The roll: long axis, then fine (AGREED)

The owner, 2026-10-03: *"at one point, long axis of the mating faces appear and dx rolls the green piece mating face so the user tries
to align the long axis — then fine roll"*. Long-axis alignment is a **deliberate** action (*"not something the game automatically
does"*); a tap was rejected (*"it has to be a more precise action"*): dx is that action.

**Long axis:** the longest in-plane direction of a MATING face (not of the whole body).
- Green piece (103.5 × 41.25 × 45 mm): body long axis its own x (2.3× the next); its other two sides almost equal (41 / 45 mm).
- Piece 10 (190 × 241 × 30 mm): the pink face is its big face (190 × 241), long axis the painting's vertical, only 1.27× the width.
- ⚠ The two long axes start PERPENDICULAR, and a yaw about the vertical cannot align them: it is a turn about `n`.

**The control:**
1. **The lines** (a pink line on the pink face's long axis, a green line on the mating face's) appear once `p ≥ greenLongAxisFromP`,
   and disappear below it minus `greenLongAxisHysteresisP`. ⭐ The owner: *"not zero, but somewhere along the way to 0.6"* —
   AGREED **0.2**: early enough to roll the long axis roughly while most of the approach is still ahead, late enough that the
   commit and the lines are two distinct moments. The roll starts with the lines.
2. **dx rolls** the piece about `n`, freely through 360°. Rolling 180° further chooses the other parallel orientation: the roll
   disambiguation, done by the same finger.
3. **The gain falls with progress**, coarse far, fine near: `rollDegPerMm(p) = coarse · (1 − p) + fine · p`. So the long-axis roll and
   the fine roll are ONE control, with no mode switch.
4. **The long-axis magnet:** within `greenLongAxisMagnetDeg` of a long-axis alignment (parallel or antiparallel), the roll settles onto
   it; dx beyond the magnet leaves it.
5. A face with no clear long axis (sides within `greenLongAxisMinRatio`) draws no line and has no magnet: the roll starts at the same
   progress, fine-only.

### 3c. Deadbands, thresholds and hysteresis (AGREED; the numbers to tune on the glass)

The owner, 2026-10-03: *"we have to define properly the deadbands, the ratios"* — and NO axis latch (*"stiffer deadbands and trigger
thresholds shall do the job if correctly tuned. Ignoring axis may create noise if the first to leave is not the one the user
intends"*). Every number below is in the code's millimetres (CSS reference mm: ~0.6 of a real mm on the tablet and the iPhone).

**The base.** §1.1's per-axis position deadband `motionDeadbandMm` **3.5 mm** (4.6 × the measured pointer noise, 0.761 mm), widened
× `orbitCrossDeadbandFactor` **3** on one axis while the other moves (10.5 mm). Only DEADBANDED travel counts below: the raw jitter never
reaches `u` or the roll.

**The push `u`** (dy). It accumulates the deadbanded dy, never below 0. The commit and the un-commit are two thresholds on it, with a
band between:

| Threshold | Default | Finger travel straight up (from rest) | With dx moving |
|---|---|---|---|
| `greenCommitMm` — commit | **8** | 3.5 + 8 = **11.5 mm** | 10.5 + 8 = **18.5 mm** |
| `greenUncommitMm` — un-commit | **3** | a pull back to `u ≤ 3` | |

- **The hysteresis band** (8 − 3 = 5 mm, ≈ 6.6 × the noise) means a finger hovering near the commit point cannot toggle the state.
- **The commit meter:** the pink ring fills with `u ÷ greenCommitMm` in `COARSE`, so the user sees the commit coming and can stop.
- **A sideways swipe cannot commit:** its dy needs 10.5 + 8 = 18.5 mm against a mostly horizontal motion.

**The snaps in `COARSE`** (dx). Unchanged: deadbanded dx, the orbit and the snap cap. While dy is moving (filling the meter), dx's
band is 10.5 mm: a push slightly off vertical does not snap.

**The roll after the lines** (dx). Deadbanded dx (10.5 mm while dy moves, so a push does not roll), the roll gain falling with `p`,
and the long-axis magnet (`greenLongAxisMagnetDeg`) holding an alignment against small dx.

**The lines** (§3b): shown at `p ≥ greenLongAxisFromP` (0.2), hidden below `greenLongAxisFromP − greenLongAxisHysteresisP` (0.15).

⚠ All of it is to be tuned on the glass; the HUD shows `u`, the meter and each axis's band.

## 4. Tunables (sliders in OBJECT ROTATION › GREEN PIECE ROTATION)

| Key | Default | Note |
|---|---|---|
| `greenCommitMm` | 8 | deadbanded dy that commits (§3c) |
| `greenUncommitMm` | 3 | the pull below which the commit is undone (§3c) |
| `greenPushTravelMm` | 40 | deadbanded dy from the commit to the standoff |
| `greenStandoffM` | 0.01 | hover gap above the pink face, metres (world) |
| `greenRollCoarseDegPerMm` | 3.0 | roll at `p = 0` |
| `greenRollFineDegPerMm` | 0.5 | roll at the standoff |
| `greenLongAxisFromP` | 0.2 | the lines (and the roll) from this progress — the owner: not 0, short of 0.6 |
| `greenLongAxisHysteresisP` | 0.05 | the lines hide below `greenLongAxisFromP` minus this |
| `greenLongAxisMagnetDeg` | 5 | the long-axis magnet's reach |
| `greenLongAxisMinRatio` | 1.1 | below it a face has no long axis |
| `greenSettlePreviewMs` | 0 | the settle preview in `COARSE` (0 = off) |
| `captureOffsetMm`, `snapConeDeg` | 10, 15° | reused: the seat's lateral and roll tolerance |

## 5. HUD

On the `green` line: `phase APPROACH u=14.2 mm (commit 8 / 3) p=0.16 r=1.84 m axial=… lateral=… roll=…° (long axis ±3°) bands x 10.5 / y 3.5`.

## 6. Build order (each with vectors, pure in `src/input/`), with the questions each step needs answered

⛔ **Do not build until the owner says so** (the owner, 2026-10-03: *"Do not start to build. I will instruct you when to start"* — *"I will
answer them as we build the respective steps"*). Each step's questions are answered when that step is built.

**Step 0. ⭐ FIRST — the start pose's heading rounded to the pink face (§0).**
- Q0.1 and Q0.2, in §0.

**Step 1. The phase machine** (state, entry and exit, the dx/dy routing) **and the HUD readout.**
- **Q1.1 dy while held.** Today dy moves the orbit between the rings. The spec gives dy to the push as soon as the piece is held, so the
  orbit ring cannot change while held. Acceptable?
- **Q1.2 A lift before the seat.** Ease the piece back to its orbit position (as spec'd), or leave it where it is?
- **Q1.3 The camera from `COMMIT` on.** Hold still (as spec'd), or keep following with a slow yaw?

**Step 2. `COMMIT`'s settle (§3a).** — no open question.

**Step 3. The approach funnel and the standoff.**
- **Q3.1 A piece behind the pink face** (`P₀` on the wrong side of the pink face's plane at the press). Refuse the approach (the HUD says
  `behind`), or route the funnel around the face?

**Step 4. The roll:** the gain schedule, then the long-axis lines and the magnet (§3b). — no open question.

**Step 5. Contact and slide.** — no open question.

**Step 6. Seat, with vibration and pop-up.** — no open question.

## 7. Settled, and later

**Settled, for the record:** the numbers of §3c (commit 8 mm, un-commit 3 mm, the lines at 0.2), the settle at the commit (§3a; its
preview off by default), the un-commit by the push alone back to the grid quaternion (§3), no axis latch (§3c), no second finger and no
lift during the motion.

**Later, not in this spec:** the second touch as the "dominant hand" (the owner: no other finger for now).
