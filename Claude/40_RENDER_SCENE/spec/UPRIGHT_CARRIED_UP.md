# ONE CARRIED UP — the picture's up turned only by what the finger asks (branch `1.0.148e-`, packet E, 2026-11-20)

> The fifth rebuild of the upright picture, and the first one that does not compute the up near the vertical from the eye's direction. Its study
> is packet A (`UPRIGHT_ONE_POSE.md` §17 on `1.0.148d-`); the owner accepted its verdict on 2026-11-20. Built behind ONE switch, `uprightCarried`
> (1 on this branch; 0 = `1f62928`, law U with his defaults and 520° a second, frame for frame).

## 1. His words (verbatim)

* His verdict on one pose (`UPRIGHT_ONE_POSE.md` §16 on `1.0.148d-`): *"scene 0bis: the dy hold is solved, the entry and exit from slanted to level
  face is solved … however the entry and exit from the triangle to the level face triggers a jitter back and forth of the camera which prolungates
  deep inside the level face (it looks like the camera does not know what to choose between the calm and the pitch), when I travel with dx around
  the corned of the zenith edge there is a lot of camera movements (which are correct) because there is no hold when I cross the zenith edge and go
  back to the triangle and back to the zenith edge from the other side etc. (check if a dx hold would do without adding too much complexity to the
  user's inputs) - scene 0: when I travel and exit along the zenith edge in polar orbit there is jitter of the camera, tilted-pole orbit is good.
  - scene 1: lot of camera movements when I travel along the dy on the level face during polar orbit (it seems like the camera rotates in pitch and
  roll to reach a full vertical square alignment on the pole: maybe we don't need the roll alignment and it can be deferred to when a dx is
  inputted during this travel). Tilted-pole orbit is good. Analyze and if patches won't fix this properly, start again (initial branch 1.0.148b-,
  new branch, lessons learned from all previous builds, deep root cause analysis, new logic with no patch)"*
* On packet A's verdict: *"ok with your recommendations except 4: the dx shall be hold only if the crossing by dx triggers a camera realignment.
  5: I will not record yet. Fix the rest and I will test if this persists or not. I believe this is a consequence of your rebuilds"*.

## 2. The lessons of every build (ten lines; the details where they are)

1. `1.0.148b-` law U (`UPRIGHT_PICTURE.md` §1 – §14): upright by a weight of the view's angle; near the vertical the weight hands the roll to the
   logic, whose turns show there (the circle, the jitter); entering or leaving the band its own rest made a second turn (the quick 180°).
2. `1.0.148c-` V1 and its fix (`UPRIGHT_PICTURE.md` §15 – §17 there): the half turn paced by the view had no moment; given one by the view, it came
   late (the hold 97 – 103 mm past the edge). A turn's moment is the logic's crossing, never the view.
3. `1.0.149-` (`UPRIGHT_AT_THE_SOURCE.md` there): the study of an upright logic at the source; L5 — a pass over the vertical needs ONE half turn.
4. `1.0.148d-` one pose (`UPRIGHT_ONE_POSE.md` §11 – §17 there): ONE pose and ONE half turn at the logic's crossing work (the circle gone, the dy
   hold as `1.0.147-`); but near the vertical its target IS the logic's pose — and the logic computes its heading FROM THE EYE'S DIRECTION.
5. Packet S (§14 there): the frames over 45° are the orbit's swing and the logic's heading rules, not the band weight; the half turn's sense the
   short way runs against the roll before it (the jitter at a pole); the "held" gizmo kept moving 100 – 250 mm a frame.
6. Packet A (§17 there): on his own play, outside the crossing turns, the camera moves by itself 172° a second near the vertical (law U 161,
   `1.0.147-` 25): the eye crosses the pole region 4 times faster since the fast orbit, and the three heading rules turn ~0.9° of roll per degree.
7. ⭐ So the up near the vertical must be a STATE moved by what the finger asks — never recomputed from the view. No up computed from the view is
   continuous at the pole (the hairy ball); a patch on one heading rule moves the spin elsewhere.

## 3. His decisions as they bind the build

* **E-D1** — ONE CARRIED UP behind `uprightCarried` (1 here; 0 = `1f62928` frame for frame).
* **E-D2** — near the vertical every alignment of the up (a level face's square layout, the spit's side, back to upright) is paid ONLY out of a dx
  he makes; never by itself. A dy never rolls the picture.
* **E-D3** — the calm's PITCH toward a face's middle is kept; only the roll is deferred.
* **E-D4** — the push that crossed: the dy as OP8 on `1.0.148d-` (set on the crossing's frame with the logic's sign — kept exactly); a crossing
  made by a dx is held ONLY IF it triggers a half turn of the up; otherwise nothing is held.
* **E-D5** — no recording of `Scene_0`'s zenith-edge gesture: he judges whether that jitter persists.
* From the studies, inside the one rule: the half turn's SENSE by continuity; its pace `uprightMaxDegS` (520° a second); T5 as written — the gizmo
  REALLY still while the half turn closes (the orbit's spring and the coast stopped too); a slider whole / never.

## 4. The design — ONE CARRIED UP

### 4.1 In plain words
The logic still computes its pose `G` each frame (where the camera is, where it looks, an up from its heading rules). The picture is `G` turned by
`φ` about the framed line — one pose's frame (OP1: drawn AND read, one glass). What changes is how `φ` moves. Each frame the picture turns about
the line only by the turn the FINGER ASKED (`τa`); whatever else `G` turned by itself (`τ − τa`) is taken back into `φ`. So a dy never rolls the
picture, a dx at a pole turns it with the turntable, and far out an upright picture stays upright. Three things alone move `φ` toward its
target: a dx (near the vertical, `k` degrees per mm of finger dx), time (far out only, beyond the band, at `uprightMaxDegS`), and the ONE half
turn at the logic's crossing.

### 4.2 The rules (pure, `src/input/upright.ts`, `upCarried`; angles rad in code, degrees in sliders)
* **C1 — the turn asked** (`askedTwist`): the twist about the framed line of the turn an honest camera makes for this frame's eye motion — away
  from the vertical the UPRIGHT camera's (an upright orbit's own roll is asked); near it the TURNTABLE's, the drawn orbit's yaw step about its
  pole axis; between (15° – 30° of the view from the vertical) the two blended by a smoothstep of the view. A weight on an INCREMENT never steps
  the picture (packet S's lesson was about weights on a target). 0 on a frame whose logic frame changed.
* **C2 — the carry**: `φc = φ − c · (τ − τa)`, `τ` the logic's twist over the frame (`twistAbout`), `c` the square camera's complement `κ`
  (1 far out; close in the picture follows `G`, as today).
* **C3 — the target** (one pose's OP3, unchanged): `T = w · h · α` — the logic's pose inside the band (its square layout, the spit's side),
  upright beyond it, a pose more than 150° from upright never blended.
* **C4 — the alignment, paid**: not in a half turn, `φ` moves toward `T` by at most `β`: near the vertical (`w` < 1) `β = k · |dx|` (mm of the
  finger's dx this frame, `uprightAlignDegPerMm`); beyond the band (`w` = 1) `β = uprightMaxDegS · dt` too. Close in (`κ` < 1): `φ = T`.
* **C5 — the half turn**: on the frame a logic change is applied at once (OP2: far out every change is), the jump is carried whole (`τa` 0) and
  `e = φc − T`; `|e| ≥ 90°` opens THE half turn. Its sense: within 30° of 180° the way the picture rolled over the last 100 ms (2° or more),
  else the short way; re-decided only by a later change. It closes in time at `uprightMaxDegS` whatever the view does.
* **C6 — the holds, from the same answer** (OP8 + E-D4): at that change, a half turn opened → the dy that crossed held as OP8
  (`holdAtCrossing`, the logic's sign); the logic's sign 0 and a dx pushing → the DX held (`dir` `[sign, 0]` on the glass he sees, released as
  the dy's: `edgeHoldMm` back); no half turn → no hold (a hold still on ended, as OP8).
* **C7 — T5 made real**: while a half turn is under way (`uprightHalfHold` 1) the orbit's target is set to the orbit DRAWN, its spring stopped,
  the coast stopped, and new steps refused (`tiltClampStep`): the gizmo stands still until the turn closes.

### 4.3 One owner per thing

| the thing | its one owner | read by |
|---|---|---|
| the logic's pose, its frame, its crossings and their dy sign | the logic (`spitStep`, `freeFaceExit`, `crossTurn`, `crossingHold`, `exitHoldSign`) | — |
| the turn the finger asked this frame | `askedTwist` (C1) from the drawn orbit's yaw step, the pole axis, the views | `upCarried` |
| the picture's up (every frame) | `upCarried` (C2 – C5) — the ONE writer | the camera, `asmCamLast`, the silent entry, the finger |
| what the up should be (the target) | the logic's heading inside the band, gravity beyond (C3) | `upCarried` only |
| the alignment's budget | the finger's dx this frame (`asmFingerDxMm`, pointer wiring) | `upCarried` |
| whether a change is a timed turn | `changeSeen` with the square camera's authority `κ` (OP2) | `changeApply` |
| the half turn: moment, sense, pace | `upCarried` on the frame of the logic's change | C6, C7 |
| the push held | C6, written once at the change (`carriedHold`) | `edgeHoldGlass` |
| the gizmo still | C7 at the orbit's spring + `tiltClampStep` (T5's one reader) | the orbit |
| close in, the tilt, the tilted pole | the square camera, the tilt, as today (`κ` 0: the picture IS `G`) | — |

### 4.4 The cases
* **`Scene_1`, a dy across the top far out** (world branch): `cameraHeading` blends to the level reading between 50° and 60° of pitch — a roll
  of `G` no finger asked: carried back into `φ`. The picture does not roll; a dx later pays the square alignment.
* **`Scene_0bis`, the level face**: `freeShownHeading` keeps turning by time toward a target that moves with the eye: carried back. The calm's
  pitch is the eye's direction, not the up: kept (E-D3).
* **The spit near the top**: `spitCameraHeading` swings with the eye's level part: carried back; the side's flip is the crossing: one half turn.
* **A dx at a pole** (`Scene_1`'s top, the turntable): asked — shown 1:1.
* **Far out, away from the vertical**: the upright camera's own roll is asked; `G` upright beyond the spit's bias and the world's level reading,
  so `φ` stays near `T`; a residue closes at `uprightMaxDegS` beyond the band.
* **Close in**: `κ` 0 — the picture is `G`; the square camera's and the tilt's timed turns as today.

### 4.5 Prior art — patent-free, no widget
Blender's turntable and the trackball's carried orientation (the camera turned by the orbit's own rotation); the rotation-minimising frame
(Bishop 1975); the hairy-ball seam placed once (the half turn at the crossing); a slew-rate limit for the half turn; phase unwrapping for its
sense; a budget paid out of the operator's own input (the held offset, `heldOffsetStep`, 2026-11-13). Nothing here is known to be patented.

## 5. The gates (BRIEF_E §5 — his symptoms first)

| gate | the bar |
|---|---|
| `his.mjs` moves not asked outside the half turns, his ten stretches (°/s: view < 20° / 20 – 50° / 50°+; level face; zenith; tip) | `1.0.147-`'s: 25 / 17 / 9; 16; 43; 8 |
| `Scene_1` dy across the top (`s4.jsonl`): roll not asked | 0° (law U: 48°) |
| back and forth (his reader) on the level face and leaving a pole | not above `1.0.147-` |
| half turns: one per crossing, sense by continuity, the gizmo still while it closes | 0 same-way re-crossings; 0 mm |
| the dy hold walks | `z_far` / `b_far` as `1.0.147-` |
| gravity over 20° · its roll a metre | not above `1f62928`'s (law U at 520) |
| frames turning the camera over 90° / 45° | not above `1f62928`'s |
| R7 away from the vertical | not above `1f62928`'s |
| close in (κ 0), 143 frames a second, `Scene_1` over its top | as `1f62928` (φ 0 where κ 0) |
| identity: `uprightCarried` 0 | frame for frame |

## 6. The build as commits
(D) this spec · (C) `upCarried`, `askedTwist`, `carriedHold`, `dxSignPushing` with vectors red on named mutants · (C) the wiring behind
`uprightCarried` (`carriedFrame` at the camera stage, the dx budget and sign in the pointer wiring, C7 at the orbit's spring), source tests ·
(P) the probes' record of the carried fields · the measurement · (D) the section as built and measured, `TUNING_MENU.md`, `RND5.md`,
`ORBIT_GATES.md`.
