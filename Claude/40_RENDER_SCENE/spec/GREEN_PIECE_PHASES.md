# Green piece — the assembly phases (prototype spec, draft)

**Status:** draft for the owner's review, 2026-10-03. Not built. Prototype branch only (`1.0.59k-`), not the main line, which
already has world-coordinate translation.

**Goal:** make the held green piece follow the way a child assembles two bricks: coarse orient → commit to a face → approach along
the insertion axis → hover → fine yaw → contact → seat. Each phase frees only the degrees of freedom it needs, and the next phase
removes more.

## 1. Scope

- Applies only while the green piece is **held for orbit** (`greenHeldForOrbit`). Not held: the orbit as today, phase `FREE`.
- **Target:** the pink ring. `T` = its centre (the yellow target), `n` = the pink face's outward normal. The **insertion axis** is
  the line through `T` along `n`.
- **Male face:** the green face currently anti-aligned with `n`, as chosen by the snapped turn.
- The green piece stays a display proxy, with no collision and no goal. "Contact" and "seat" are computed from its own hull against
  the pink face's plane and extent.

## 2. Quantities

| Name | Meaning |
|---|---|
| `P₀` | green piece position at the press (on the orbit surface) |
| `r₀` | `|P₀ − T|`, already stored as `greenPressRadialM` |
| `S` | the **standoff point**: `T + n · (standoffM + h)`, where `h` is the green piece's half-depth along `n` |
| `p` | approach progress, 0 at the press, 1 at `S` |
| `G` | green piece position |

## 3. Phases

| Phase | Entry | dx | dy (finger up = toward target) | Rotation | Camera |
|---|---|---|---|---|---|
| `FREE` | not held | orbit yaw (full gain) | orbit ring | none | follows |
| `COARSE` | press on the piece | orbit yaw + the snapped face turn (as today) | **push**: the first push commits → `APPROACH` | snaps (90°/90°) | follows |
| `APPROACH` | `0 < p < 1` | ignored | push / pull: `p += dy_mm ÷ pushTravelMm` | **locked** on the committed face | holds its yaw, keeps the piece in view |
| `STANDOFF` | `p = 1` | **fine yaw** about `n` | a further push past `S` → `CONTACT`; a pull → back to `APPROACH` | twist only | holds |
| `CONTACT` | the male face touches the pink face's plane | slide along the face's first in-plane axis | slide along the second in-plane axis | twist only | holds |
| `SEATED` | in `CONTACT`, lateral offset < `captureOffsetMm` (on the glass) and twist error < `snapConeDeg` | — | — | lerped onto the exact seat | holds |

**Approach path (the "funnel"):** `G(p) = S + axial(P₀ − S)·(1 − p) + lateral(P₀ − S)·(1 − p)²`. The axial part closes linearly. The
lateral part (perpendicular to `n`) closes quadratically, so the piece lines up with the axis before it arrives. The user never steers
laterally.

**Backing out:** a pull reduces `p`, back through `STANDOFF` to `APPROACH`. At `p = 0` the face unlocks and the phase is `COARSE` again.
`CONTACT` is left only by the lift, because dy slides there.

**Lift before `SEATED`:** the piece eases back to its orbit position (`P₀` + whatever orbit happened), and the phase becomes `FREE`.

**`SEATED`:** the piece rests seated until the lift, then returns to the orbit (for now). Seat feedback: a short vibration where
supported (Android `navigator.vibrate`; iOS has none) and a pop-up like the goal's.

**Contact feedback:** a short vibration pulse on entering `CONTACT`.

## 3bis. `ALIGN` — the long axes, a DELIBERATE action (concept agreed; execution to be redesigned)

The owner, 2026-10-03: *"long axis identification and alignments shall be a deliberate action by the user, not something the game
automatically does"* → *"the concept is OK"*, but *"I am not happy with a tap, it has to be a more precise action"*.

**Long axis:** the longest in-plane direction of a MATING face (not of the whole body), because only the face plane matters for the
match.
- Green piece (103.5 × 41.25 × 45 mm): its body long axis is its own x (2.3× the next, unambiguous). Its other two sides are almost
  equal (41 / 45 mm), so its "across" is nearly a toss-up.
- Piece 10 (190 × 241 × 30 mm): the pink face is its big face (190 × 241), whose long axis is the painting's vertical. It is only
  1.27× the width: a weak cue.
- ⚠ The two long axes start PERPENDICULAR (the green one horizontal, Piece 10's vertical). A yaw about the vertical cannot align them:
  it is a turn about the insertion axis `n`. So long-axis alignment cannot live in the yaw snaps.

**Why deliberate:** it is the child's visual "kill the biggest mismatch" decision; automated, the game would pick parallel or
antiparallel on the user's behalf; and a weak cue (1.27×) would be aligned with confidence. Cost: one more input (one more scored episode
in the full game), accepted.

**Where:** after the face is committed and before the fine yaw — during `APPROACH` or `STANDOFF`. It turns the piece about `n` only.
1. **Show both long axes** from `APPROACH` on: a pink line along the pink face's in-plane long axis, a green line along the male
   face's. The user cannot align what they cannot see.
2. **The action** turns the green line parallel to the pink one. Of the two parallel orientations, the user chooses which: a second
   action of the same kind turns it 180°, the child's roll disambiguation.
3. The **fine yaw** at the standoff then removes what is left.
4. A face with no clear long axis (sides within `greenLongAxisMinRatio`, e.g. 1.1) draws no line, and the action does nothing.

**Execution: OPEN.** A tap was proposed and REJECTED as not precise enough. Candidates for the owner:
- a second-finger DRAG that turns the green line about `n` directly (an angle under the finger), snapping onto the pink line when it
  comes within a few degrees: precise, and the user both sees and chooses the alignment and its sense;
- a press-and-hold on the pink line, then a drag to "lay" the green line onto it;
- on desktop: right-drag, or a modifier with the wheel.

## 4. Tunables (sliders in OBJECT ROTATION › GREEN PIECE ROTATION)

| Key | Default | Note |
|---|---|---|
| `greenPushTravelMm` | 40 | finger travel from the press to the standoff |
| `greenStandoffM` | 0.01 | hover gap above the pink face, metres (world) |
| `greenFineYawDegPerMm` | 1.0 | fine yaw in `STANDOFF` / `CONTACT` |
| `captureOffsetMm`, `snapConeDeg` | 10, 15° | reused: the seat's lateral and twist tolerance |
| `greenLongAxisMinRatio` | 1.1 | below it a face has no long axis: no line, no `ALIGN` |

## 5. HUD

On the `green` line: `phase APPROACH p=0.62 r=1.84 m axial=… lateral=…`.

## 6. Build order (each with vectors, pure in `src/input/`)

1. The phase machine (state, entry and exit, the dx/dy routing) and the HUD readout.
2. The approach funnel and the standoff.
3. Fine yaw.
4. Contact and slide.
5. Seat, with vibration and pop-up.
6. `ALIGN`: the two long-axis lines first (visible); the action once its execution is decided (§3bis).

## 7. Open questions for the owner

1. **dy while held:** today it moves the orbit ring. The spec gives it to the push as soon as the piece is held, so the orbit ring
   can't change while held. Acceptable, or should the push only take dy after a commit gesture?
2. **Commit:** the first push commits the face (rotation before translation). Or should a deliberate gesture commit (a second-finger
   tap, or a pause)?
3. **Piece behind the face** (`P₀` on the wrong side of the pink face's plane): refuse the approach (HUD `behind`), or route the funnel
   around?
4. **Lift before the seat:** ease back to the orbit (spec), or leave the piece where it is?
5. **Camera from `APPROACH` on:** hold, as spec'd; or keep following a slow yaw?
6. **`ALIGN`'s execution** (§3bis): which precise action turns the green long axis onto the pink one (not a tap).
7. **Later, not in this spec:** the second touch as the "dominant hand".
