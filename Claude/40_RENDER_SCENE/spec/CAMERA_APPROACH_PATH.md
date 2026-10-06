# The camera's approach path — specification (prototype)

> **Status:** AGREED and ✅ BUILT 2026-10-06 (⛔ unjudged by a hand) — `input/camera_path.ts` (the rule: `pathParam`, `pathAngles`,
> `pathCamera`, `pieceInFrame`), `render/green_box_wiring.ts` (`latchCameraPath`, `cameraPathPosition`), CAMERA › CAMERA APPROACH PATH;
> vectors `tests/proto_camera_path.test.ts`. Checked headless (§10). Branch `1.0.59t-`. Prototype only (the
> double-orbit camera, `DOUBLE_ORBIT_PROTOTYPE.md`), not the main line.
> **Source:** the owner, 2026-10-06: *"I want to create a new path for the camera. There is no change for the piece orbit (4 rings, dx = yaw
> orbit, dy pushes the piece towards or away from orbit center and moves the piece to respective rings). The new camera path latches when the
> piece is beyond 2.7m distance and resting face alignment triggered. From 2.7 m to 2.4m the camera moves on a path which brings the camera
> almost above the piece. From 2.4m to 2.1m the camera moves on a path which brings the camera almost 90degrees to the right of the piece.
> From 2.1m to 1.8m the camera moves to a path which brings it back to its position in the respective 4 existing rings. The distance of the
> camera to the piece is always maintained. The camera always look at the orbit center. If the camera is not on the existing rings, the yaw
> and pitch offsets are ignored. The path is reversed if dy is reversed."* — then *"I would prefer to keep the camera looking at the orbit
> center. That means restricting the above and the to the right the camera can reach"* (§4).

---

## 1. What does not change

- **The piece's orbit:** the four rings; `dx` the yaw orbit; `dy` moves the piece along the rings, toward or away from the orbit centre.
- **The resting-face alignment** (`RESTING_FACE_ALIGNMENT.md`): the gesture that latches the path is its first tap (a second-touch tap on
  the piece; the right tap on the desktop).
- **The zoom** (pinch, wheel): it still sets the camera's distance to the piece (`cameraGapM`), during the path too.

---

## 2. The latch

- The path **LATCHES** when the resting-face alignment is triggered **while the piece is farther than 2.7 m** from the orbit centre (its
  distance to the yellow target, the HUD's `green` line).
- ⭐ An alignment triggered with the piece already inside 2.7 m: **no path** — starting mid-path would jump (Q1, agreed).
- Once latched, the path applies while the piece is inside the band **2.7 → 1.8 m**; outside it the camera is today's (§6).
- ⭐ It UNLATCHES on a respawn (the SCENE switch) and on a new alignment — never by leaving the band, so going back past 2.7 m and
  returning replays the path (it is reversible, §3) (Q2, agreed).
- ⭐ The **side** the camera swings to ("right") and the **screen orientation** (landscape / portrait, §4) are taken AT THE LATCH and frozen
  for the path.

---

## 3. The path — parameterised by the piece's distance alone

The camera's place is a function of **`d`, the piece's distance to the orbit centre** — nothing else is integrated, so:
- **reversing `dy` reverses the path**, exactly, at any point (*"The path is reversed if dy is reversed"*);
- nothing drifts, and the camera's place at a given `d` is always the same.

| segment | `d` | the camera goes … |
|---|---|---|
| A | 2.7 → 2.4 m | from its **normal pose** to **ABOVE** the piece (§4) |
| B | 2.4 → 2.1 m | from ABOVE to the piece's **RIGHT** (§4) |
| C | 2.1 → 1.8 m | from the RIGHT back to its **normal pose** on the rings |

**The key poses** are angles of the camera AROUND THE PIECE, in a frame at the piece: *behind* = the horizontal direction from the orbit
centre to the piece; *up* = the world vertical; *right* = the camera's right at the latch (§2):
- **NORMAL** — today's camera pose (its ring, its leash, its yaw and pitch offsets), **computed live** each frame — so both ends of the path
  are exactly today's camera and nothing jumps entering or leaving the band;
- **ABOVE** — the normal pose raised by `pathAboveDeg` around the piece (elevation);
- **RIGHT** — the normal pose swung by `pathRightDeg` around the vertical through the piece, to the right (azimuth), at the normal elevation.

**The motion between them:** one smooth curve through the four key poses (a Catmull-Rom spline in the two angles), so the camera **never
stops at a key pose** — a per-segment ease would bring it to rest at 2.4 and 2.1 m.

**The distance to the piece is always maintained** (*"The distance of the camera to the piece is always maintained"*): the camera stays on
the sphere of radius `cameraGapM` (the zoom's) around the piece.

**The camera always looks at the orbit centre** (the yellow target).

**The yaw orbit (`dx`) during the path:** the frame turns with the piece's heading, so the whole path goes round with it.

---

## 4. How far ABOVE and to the RIGHT — the reach, computed

With the camera looking at the orbit centre, the piece stays in the frame only so far: rising around the piece drops it toward the bottom
of the frame; swinging to its side pushes it off the screen's edge. ⭐ Computed on `Scene_1`'s rings (2026-10-06): the piece's centre kept
inside **90 %** of the half field of view (Babylon's default, 46° vertical; the horizontal from the aspect, 1.6 landscape), at a fixed
distance to the piece.

In the band, the piece is on a slope of the outer rings, 1.0–1.4 m above the centre (the upper half) or below it (the lower half); the
normal camera is behind it, ~32–35° up (upper half) or down (lower half).

**ABOVE** — the highest elevation around the piece:

| zoom (camera to piece) | upper half | lower half | ⭐ rise above the normal pose |
|---|---|---|---|
| 0.6 (0.75 m) | 58–64° | −6° | ~26° |
| **1 (1.25 m, default)** | **62–69°** | **−2 to 0°** | **~30°** |
| 1.5 (1.88 m) | 67–77° | +2 to +7° | ~35–40° |

**RIGHT** — the widest azimuth around the piece, at the normal elevation:

| zoom | landscape | portrait |
|---|---|---|
| 0.6 | 46–53° | 20–23° |
| **1 (default)** | **53–64°** | **23–28°** |
| 1.5 | 62–79° | 27–33° |

(the lower bound at 2.7 m, the upper at 1.8 m — the reach grows as the piece comes in.)

⭐ **The defaults, inside the reach at the default zoom, both halves, every distance:**
- **`pathAboveDeg` = 25°** above the normal pose — *"almost above"* becomes *steeply above* on the upper rings and *level with the piece*
  on the lower ones; ⛔ overhead is out of reach while looking at the centre;
- **`pathRightDeg` = 50° in landscape, 20° in portrait** — the orientation at the latch decides (§2); ⛔ 90° is out of reach.
- ⚠ A smaller zoom shrinks the reach (at 0.6, 50° in landscape is at the edge). ⭐ The angles are **CLAMPED to the reach at the CURRENT
  zoom** each frame — the piece never leaves the frame (Q3, agreed).

---

## 5. The yaw and pitch offsets

*"If the camera is not on the existing rings, the yaw and pitch offsets are ignored."* ⭐ They FADE rather than switch: full at the normal
pose (the band's two ends), zero at ABOVE and RIGHT, following the same curve — a switch would make a step.

---

## 6. What the path suspends, and what it keeps

- **Suspended while it applies:** the camera's own follow (its leash, its catch-up glide, its time lag) — its place comes from the piece.
- **Kept:** the zoom (the distance), the look at the centre, the piece's own motion (unchanged, §1), the counter-yaw rule
  (`RESTING_FACE_ALIGNMENT.md` §2bis — stopped once aligned, which the latch implies).
- **Leaving the band** (beyond 2.7 m or inside 1.8 m): today's camera, the path's ends being today's pose — no jump either way.

---

## 7. Settings (sliders)

| setting | default | note |
|---|---|---|
| `pathStartM`, `pathAboveM`, `pathRightM`, `pathEndM` | 2.7, 2.4, 2.1, 1.8 m | the band and its key distances |
| `pathAboveDeg` | 25° | above the normal pose (§4) |
| `pathRightDegLandscape` / `pathRightDegPortrait` | 50° / 20° | to the right (§4) |
| `pathOn` | 1 | the path on / off |

---

## 8. To check when built

- **Vectors:** the key poses at 2.7 / 2.4 / 2.1 / 1.8 m; the path reversed exactly (the same `d`, the same camera); the distance to the
  piece constant along it; the piece inside the frame at every `d` with the defaults (both halves, both orientations, zoom 1); the offsets
  faded to zero at ABOVE and RIGHT; no step entering or leaving the band; the latch only beyond 2.7 m.
- **Headless:** an alignment beyond 2.7 m, then `dy` toward the centre — the HUD reading the segment and the camera's angles; screenshots
  at the three key distances.
- ⛔ **A device look closes it** (rule 5).

## 9. Decisions (the owner, 2026-10-06: *"agreed"* — all four as proposed)

1. **Q1** — an alignment with the piece already inside 2.7 m: **no path** (starting mid-path would jump).
2. **Q2** — the unlatch: **on a respawn and on a new alignment**; leaving the band does not unlatch (coming back replays the path).
3. **Q3** — a small zoom: the angles are **CLAMPED to the reach at the current zoom**, each frame — the piece never leaves the frame.
4. **Q4** — **25° above** the normal pose; **50° to the right in landscape, 20° in portrait**.

## 10. As built — checked headless (2026-10-06)

On `Scene_1` at zoom 1: an alignment tap at boot (the piece at 2.997 m) latches; the orbit finger then pushes the piece inward, the HUD
reading `path t … ↑… →…`: from 2.7 m the camera rises — **↑24° near 2.4 m** — swings — **→50° at 2.1 m** — and comes back by 1.8 m; outside
the band, today's camera (`path latched`). No error. ⚠ The Catmull-Rom curve overshoots its keys slightly between them (→−3° on the way up,
↑−2° on the way back) — inside the reach. On a screenshot at RIGHT (2.06 m, →48°): the piece on the left, its pink face toward the painting,
the target centred — the approach seen from the side. ⭐ The base pose blends from the LIVE normal one (leash and offsets included) at the
band's ends to the IDEAL one (straight behind the piece, no offsets) at ABOVE and RIGHT — so entering and leaving the band never jumps.
