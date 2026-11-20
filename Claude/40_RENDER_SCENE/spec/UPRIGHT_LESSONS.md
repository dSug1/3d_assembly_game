# The upright picture — LESSONS LEARNED (the checklist every camera design is read against)

> **What this is**: the permanent record of why every attempt to keep the camera's picture upright during the orbit failed between
> 2026-11-18 and 2026-11-20, what each taught, and the process rules they forced. ⭐ Any new camera rule is checked against EVERY row
> below, in writing, BEFORE it is built (the owner, 2026-11-20: *"make sure you capture all the lessons learned from all the previous upright
> picture which failed so we do not repeat once again the same failures"*). The detailed ledger, with what a polar follower would have done in
> each row, is [`CAMERA_FOLLOWS_GIZMO.md`](CAMERA_FOLLOWS_GIZMO.md) §2; the design that follows from it is the same file.

## 1. The pattern behind every failure (one sentence)
**Every failure tied the picture's turning to something other than his hand** — the orbit's own heading rules (its facet frames, the spit's
side, a level face's layout, the calm's square alignment), the view's angle (a weight, a band), or TIME (a pace, a timed turn) — and, in the
first builds, tied the HOLDS to what the picture showed. Each rebuild moved the same disruption somewhere else.

## 2. The builds, what failed, the root, the rule
| # | build (branch / commit) | what HE saw, or what failed | the root | the rule it binds |
|---|---|---|---|---|
| 1 | law U, `1.0.148b-` (live 11-19, `675ec23`) | a rapid 180° roll + a circle at a level face / zenith edge; a jitter at a pole | TWO owners of the roll: the logic's pose (its timed half turns) and a picture law weighted by the view's angle; near the vertical the weight handed the roll back to the logic | ONE owner of the picture's roll |
| 2 | law U fix rounds 1 – 3 (`1.0.148b-`) | each round moved the conflict (frames > 45°, the finger's way, holds lost) | patches on the JOIN of two owners (carry weights, freed turns, holds deleted afterwards) | root, not patch; no layer that undoes what the logic decided; after a SECOND fix round on one join, STOP and study |
| 3 | V1, `1.0.148c-` | the dy hold over a ridge lost; gravity tilted 30 % of frames | the half turn paced by the VIEW: no moment, so no gizmo hold and no push hold; holding the gizmo while a view-paced turn closes is a deadlock | a turn that needs a hold needs a decided moment; holds never depend on the picture |
| 4 | V1's fix (`1.0.148c-`, `ca4a4ae`) | the hold 97 – 103 mm late; none under the bottom | the moment chosen by the view (leaving 15°); the hold read "a turn SEEN" | the holds come from the LOGIC's crossing (OP8) — solved since, never touched |
| 5 | option 3 study, `1.0.149-` (not built) | — | every half turn on his hand is a pass over / under the world's vertical: unavoidable with an upright picture | at most ONE half turn a pass; only its count, place and pace are free |
| 6 | one pose, `1.0.148d-` | back and forth leaving a pole (`Scene_1`, `Scene_0`); a circle with the roll on `Scene_0bis`'s bottom; his yaw at a pole lagging 70 – 80° | near the vertical the picture took the logic's heading rules (they move by themselves); a pace capped every motion, his finger's included; a "held" gizmo still moved | a pace closes only a gap a change opens — never his own motion; a hold must really hold |
| 7 | one pose fix round 1 | frames over 45° doubled at his fastest | following the logic exactly showed its view jumps and heading swings (the spit's weak side bias, the level face's seam) | the logic's heading rules near the vertical are NO source for the picture |
| 8 | the gates of `1.0.148b-` – `d-` | builds passed the gates and failed his eye | the readers did not count what he describes | a gate counts what HE names (`fo3/rebuild_d/a/his.mjs`: back and forth, moves not asked; `fo3/rebuild_e/j/jr.mjs`: the piece's jumps); a reader that misses his complaint is not a gate |
| 9 | the carried up, `1.0.148e-` `28a29ca` (*"good"*) | a snap to the vertical leaving `Scene_1`'s top; 80° of roll in 40 ms on a dx near a pole; the piece leaping at a level face | the leftover alignment paid by TIME; a dx paid 3°/mm on top of the turntable; a change applied at once skipped the 2026-11-14 cure for the piece | every realignment paid by HIS FINGER (*"driven by delta position mm"*), never by time; a change's framing slides (`uprightFraming`, live) |
| 10 | carried up fix round 1 (`38a2fdd`, not deployed) | `Scene_1` dy over the top: 250° not asked | his decisions MISREAD in code: "a dx" read as the orbit's yaw step; "the dy leaving" paid on any outward drift (time in disguise); paid toward the wrong target | each payer reads the FINGER's own input, only while it moves; a vector per decision, red on a mutant; the lead reads the code against his words |
| 11 | live `b03a4dd` (carried up + framing) | two circles a pass from a tip's triangle across the bottom face (his video 15:44) | the half turn still decided by the logic's heading flips (a level face's exit 180° + the spit's side 180°) | the picture never listens to the logic's heading — the camera becomes a simple polar orbit that FOLLOWS the gizmo (`CAMERA_FOLLOWS_GIZMO.md`) |

**Not the root everywhere**: the topology is the root of rows 1, 2, 7, 8, 10, 11; rows 3 – 6 and 9 are the pass over the vertical itself,
which no camera removes — a polar camera turns it into ONE yaw a pass (§5.5 of the design). The logic's view DIRECTION is not jumpy (measured:
3 frames over 45° in 9 274): what jumped was the roll, and the yaw at a pole.

## 3. SOLVED — must never regress (his eye)
The gizmo's travel (polar orbit and the tilted-pole orbit — what drives the piece and the gizmo is never reopened); the dy hold from the
logic's crossing (OP8: `z_far` / `b_far` as `1.0.147-`, zero re-crossings under a steady push); a slanted face's entry / exit to a level face;
close in (the square camera, the tilted pole); the piece's slide at a change (packet J); his settings: band 15 / 50, pace 520°/s.

## 4. His decisions that stand (verbatim where they were given)
* No roll of the scene on screen; a yaw or a pitch is fine (2026-11-18). The pole's half turn as ONE smooth yaw, never a roll (*"I believe this
  is the best option"*, 2026-11-20).
* Realignments driven by his finger's mm, not by time (*"why is it so fast and not driven by delta position mm ?"*); a dx crossing held only if
  it triggers a camera realignment (E-D4).
* The camera looks at the centre of its orbit (*"we have decided that several times in the past"*); the calm is part of the camera's orbit (*"the
  calm was developped exactly for the purpose of the user being able to see properly the extremities of the faces"*).
* The camera a simple polar orbit following the gizmo through a smooth, faithful function (his proposal, 2026-11-20 →
  `CAMERA_FOLLOWS_GIZMO.md` §0, §12).

## 5. The process rules these failures forced
1. **Docs before build**: his words verbatim, his decisions, the design with ONE OWNER PER THING, the gates — in the spec before any code.
2. **A study before a third attempt** on the same join; his four parts: rules → obstacles read in the code → a design from prior art → its audit.
3. **His symptoms are the gates**, counted as he names them, at HIS pace (the desktop: a mouse, ~130 fps, 1 200 px/s at the top tenth; the
   phone: 571 px/s mean), on every earlier build side by side through switches.
4. **One switch per change, 0 = the previous build frame for frame** (an identity run proves it), so he can compare on the device and nothing is lost.
5. **The lead re-reads every major figure** from an agent before it reaches him, and reads the code against his words (row 10).
6. **The PC**: one headless job at a time; NO batch while he tests on this PC; never read drive E: (a USB disk with read errors — it crashed the
   PC on 2026-11-20); his sessions and videos are copied to the internal disk (`fo3/hand/sessions/`, `fo3/rebuild_e/videos/`).
7. **A device look closes a change** (CLAUDE.md rule 5): a green suite and good figures are not his eye.

## 6. Where everything lives
Branches (local unless said): `1.0.148b-Fast_orbit_upright_gravity` (law U); `1.0.148c-Upright_near_the_vertical` (V1, closed as the record);
`1.0.149-Upright_at_the_source` (option 3 study); `1.0.148d-` (one pose, pushed); `1.0.148e-` (the carried up, framing, packet K's payers —
pushed to `461eeb2`, K local and unmeasured); `1.0.150-Camera_follows_gizmo` (the follower, from `461eeb2`). Their specs:
`UPRIGHT_PICTURE.md`, `UPRIGHT_AT_THE_SOURCE.md`, `UPRIGHT_ONE_POSE.md`, `UPRIGHT_CARRIED_UP.md` on their branches; the kit
`../_saved_patches/orbit_chain_2026-11-18/fo3/` (briefs, checkpoints, readers, recordings).
⭐ **At the end — when the orbit charts are completed — everything is merged into the `3d_assembly_game` worktree** (the owner, 2026-11-20).
