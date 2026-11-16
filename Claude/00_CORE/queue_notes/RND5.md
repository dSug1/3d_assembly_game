# RND5 — The orbit on charts

> **STATUS** · ✅ spec APPROVED 2026-11-15; ✅ steps 1.1 – 2.1; 🔧 2.2, 2.3 and **step 2.4 (P, 2.4a – 2.4c, 2.4e) built, DEPLOYED** (main `902ae88`), the owner's look 2026-11-16: *"looks on pc and mobile look good. OK with two comments"*; 🔧 **2.4d (the band against noise) built and DEPLOYED 2026-11-16** (`42a408a`, **1960 vectors**; the owner: *"Deploy"* — main `f1e03d3`), its look owed; ⭐ **the tilted-pole orbit's STUDY written, PROPOSED** (`TILTED_POLE_CLOSE_IN.md`: the owner's decisions D-T1 – D-T7 before any build); ⛔ 2.5 (the old detectors deleted) after it → the spec's §12.3
> **LAST VERIFIED** · 2026-11-16

## 2026-11-15 — queued (the owner: *"I want to implement your systematic approach"*)

* **The spec**: [`../../40_RENDER_SCENE/spec/ORBIT_CHARTS.md`](../../40_RENDER_SCENE/spec/ORBIT_CHARTS.md) — the rules in the order they yield, the
  chart (a frame and the faces it serves), a face's kind in a chart, the assignment, the one transition, the calm, the steps and their gates.
* **The prototype** (offline, simple convex shapes): `scripts/probes/chart_lib.ts` (the reference a port is checked against) and its runner
  `chart_study.ts` — equal to the built map on `Scene_1`, `Scene_0` and `Scene_0bis`'s frame to 10⁻¹² mm; 0 leaps and 0.00 % of steps moving nothing
  on each chart's own faces, 35 shapes. The calm: `scripts/probes/calm_study.ts`. Their shapes: `scripts/probes/shapes_lib.ts`.
* **Decided by the owner**: the order of the rules; step A (the pitch scale from the normals, the pole as the shape's top and bottom) may change
  `Scene_0`'s mapping; step B (the view read from the place) a later milestone; Opus agents launched from the Fable session, local commits on the
  rebuild's own branch in its own worktree, one `npm run verify` by the agent and one by the auditor per step.
* **Owed**: step 1.1 onward (the spec's §7.2), each closed by its gate; the owner's look from step 2.2.

## 2026-11-15 — APPROVED (the owner: *"This is good. Charts approved. Commit. Proceed with execution."*)

* After the sections were shown on 14 of the shapes (the artifact *Orbit Chart Sections*, https://claude.ai/artifact/BkQd1Ffrx6QLsdcsRUKYxn). The
  spec's §8 defaults stand until the owner changes one.
* The build: the worktree `../orbit_charts`, branch `1.0.146-Orbit-charts` (from `1.0.145-`), one commit per step, never pushed by an agent.
* **Out of scope** (the owner): what the "surface" of an assembly is — protrusions, channels, holes.

## 2026-11-15 — step 1.1 BUILT (`7cd63a4`, an Opus agent) and AUDITED (Fable)

* `buildFaceMap`'s optional `layout: "chart"` and `scale: "normals"` (absent: today's map, untouched); the record and the gates' figures: the spec's
  §7.3. **1812 vectors.** Nothing is wired: the game does not change.
* Found, each written into the spec: a frame's box must be the contour's, not `tiltBox` (§3); "chart" with the built scale is today's map to the
  rounding only (§7.3); the shed's statement corrected (§9).
* **Step 1.2** (`445a194`, `9718ead`): `src/input/orbit_charts.ts`, the assignment — EXACTLY the prototype's on the 35 shapes; the audit found the
  border peel unpinned, now vector 10; **1822 vectors**; the record: the spec's §7.3. Noted for 2.1: the candidates' cost at a seat.
* **Step 1.3** (`e82262e`): `src/input/ring_chart.ts`, the rings fallback — EXACTLY the prototype's places on the 35 shapes; **1834 vectors**;
  0.3 – 0.8 µs a place; the record: the spec's §7.3.
* **Step 1.4** (`c2f3d3a`): `edgeShareSmooth` and `CalmKnobs.smooth` in `orbit_calm.ts`; **1840 vectors**; the record: the spec's §7.3.
  ⭐ Steps 1.1 – 1.4 closed.
* **The owner, the same day** (the headless replay): it runs on the owner's PC and must clean after itself; ⛔ **`Scene_2` is OUT** — *"I still
  need to review the proxy faces and the ghost faces … I will do it myself when I troubleshoot the scene. Focus on the other scene 0, 0bis and 1."*
* **Step 2.1, the replay's baseline** (Fable): today's game recorded on `Scene_1`, `Scene_0`, `Scene_0bis`; the rebuild branch after steps
  1.1 – 1.4 replays IDENTICAL, bit for bit, on the three; nothing left on the disk but the three baseline recordings (16 MB, the scratchpad).
* **Step 2.1, the inventory** (`312d299`): `40_RENDER_SCENE/spec/ORBIT_STATE_INVENTORY.md` — 53 state fields, the three changes of frame, the
  specificities' paths, the angle assumptions, the sway; samples checked against the code. Its main constraints: the spec's §4.2.
* ⛔⛔ **The replay was hollow, found and fixed the same day**: the game's no-frame watchdog put a full-screen error box over the canvas under the
  probe's virtual clock, every press landed on it, nothing moved — the first baseline and its "identical bit for bit" compared the boot pose. The probe
  fixed (it fails when the script moves nothing), the baseline re-recorded (the gizmo 23 – 25 m a run). ⚠ CL1's check used the same probe.
* **Step 2.2** (`9e38e78`, `7463174`): `chartLayout`, off by default; switch off = today's game on the three scenes; switch on = `Scene_1` the
  same play (≤ 10⁻⁹ m), `Scene_0` and `Scene_0bis` another play, no error; **1845 vectors**; the owner's look owed. The record: the spec's §7.3.
* **The owner, the same day**: fix the centre read off the drawn meshes; a held part must not inherit the last one's orbit state. ✅ The
  state's one home built (`f1b7573`: reset at each pick-up; ⛔ not at the test scenes' piece switch — the owner's to decide). ⛔ The centre built
  (`a3826a1`) then REVERTED (`8008ce0`): today's centre is the ORIGIN by accident (the meshes' boxes read before they are placed), the model's is
  31 cm into the assembly — another framing, the owner's decision. The record: the spec's §7.3.
* **CL1's bit-for-bit check redone with the fixed probe** (the owner: *"Do it."*): the clean-up changed nothing (the spec's §7.3).
* **Deployed** (the owner: *"Deploy afterwards so i can test scene 0 and scene 0bis"*): `8008ce0` as main `7db32b6`; `?chartLayout=1` or the
  slider (GIZMO & SECTIONS) turns the charts' layout on; **1851 vectors**.
* **The owner, the same day (the sway)**: the orbit reads the MODEL's coordinates, never the swayed assembly's → the spec's §4.5; one input reads
  the drawn meshes today (`placedBox` → the assembly's centre and radius at a pick-up): the owner's to decide.
* **The owner, the same day**: test scenes of the builder's choice may live in ANOTHER worktree, reviewed then deleted by the owner (the spec's §7.2).
* **The owner, the same day**: how the specificities (holes, voids, channels, mouths, protrusions) are handled → the spec's §4.4: untouched below the
  charts; the mouth's hand-over is coupled to the tilt and is carried over at step 2.4; `Scene_2`'s contour is not measured yet.
* **The owner's look with the switch on** (2026-11-15): *"everything ok with charts switched on"* (⚠ the device not stated); a desktop recording
  of `Scene_0bis` sent the same day was withdrawn (*"The charts were switched off."*). The record: the spec's §7.3.
* **The owner's decisions**: *"Center: keep the origin for the moment"*; *"State reset: do what is best for"* (the message ended there) — read as
  the builder's call: the reset wherever a piece starts being orbited; ✅ built (`spawnOrbitPiece`, not at the boot; the spring's last place
  cleared with it), probed in the app under a tilt and in a zone; **1857 vectors**. Found, not changed: a switch or a respawn keeps the approach.
* **The black scene on the phone: solved** (the owner: *"it is now working on the phone. solved."*); its cause was never found.
* **A black scene on the owner's iPhone after the deploy**: not reproduced, its cause unknown, not reported again since; `2cae564` (local, not
  deployed) adds the HUD's `draw` line (the WebGL context, the frames, the last interval, the canvas's size); **1856 vectors**.
* **For later, at the owner's request** → the spec's §10: (1) the tilted pole close in is KEPT (rule §3 6.) and checked on the build with the
  switch off and on, but general on every kind of face only by a step of its own, **step C**, after 2.5; (2) a band against input noise at every
  trigger of a camera movement (the example: the square camera's target at an edge close in, no band today), considered at step 2.4.
* **Step 2.3** (the owner: *"continue to next step"*; `fcfa8bd`, an Opus agent, audited): the calm on every side face behind `chartCalm` (off; acts
  only with `chartLayout` 1) — the share continuous on a narrow run, a fan's facets calmed, no fade by the pitch on a side facet; **1867 vectors**;
  both switches off = the commit before, bit for bit; with the calm `Scene_1` identical, `Scene_0bis` another play (no single-frame jump; a few more
  fast rolls round a tip). ⛔ The owner's look on `Scene_0bis` owed. The record: the spec's §7.3.
* ⛔ **Found measuring its baseline, fixed** (`72cdc54`): a tilt left with the orbit exactly at a pole reset the yaw to 0 — a 90° roll in one frame
  in today's game (`Scene_1`'s top, the piece in then out), 157° on `Scene_0`'s ridge under the charts' layout, where a press on the ridge also left
  its tilt at once (the gizmo on the tilted facet's border). **1869 vectors**; the switches off still bit for bit. The record: the spec's §7.3.
* **Found, not fixed** (today's game, for step 2.4 — the spec's §10.2): close in, a fast dy onto `Scene_1`'s bottom face and off it within the frame
  makes the automatic tilt and leaves it at once: 45° and 90° rolls in one frame.
* **Deployed a second time** (the owner: *"deploy"*): `6d5f2b7` as main `157974f`, live; `?chartLayout=1&chartCalm=1` or the two sliders (GIZMO &
  SECTIONS) turn the charts' layout and the new calm on; **1869 vectors**.
* **The owner's look on the second deploy** (2026-11-15): *"overall is good"*; four reports (the calm "unleashes" from the rectangle onto the triangle
  on `Scene_0bis`; on `Scene_0` with the charts on: the camera realigns at a click on the top slanted faces and the bottom, half turns on the top
  faces, the gizmo once on the face opposite the camera) and ⛔ *"analyze the deep root cause, don't patch with fix which may conflict with other
  rules"*. The analysis: the spec's §11 — one root cause (the orbit's place stored twice, as a direction and as a chart coordinate; the old
  detectors still deciding where a frame changes; the calm's per-face references), the basis of step 2.4. The fix built for the first report is
  shelved (`git stash`), not committed.
* **The press's action** (the owner, 2026-11-15: *"Why does a press have an action at all on the orbit? … Why did it appear now?"*): the owner's
  rule of 2026-11-09, built 2026-11-10, in every build since; measured with a press held still (the spec's §11.1): unseen on `Scene_1` square, 2° –
  9.5° on `Scene_0` before the charts, 3° – 9° at rest under the charts' layout. ⛔ The owner's to decide: no action at a press (the tilt close in only).
* **The owner's decision** (2026-11-15): *"Instruct the Opus agent to cancel my rule and remove the press action on the orbit. Then build step
  2.4 as you have recommended in your previous message."* — the design and the build's record: the spec's §12 (sub-steps P, 2.4a – 2.4e, each
  under `chartLayout` 1 but P). ✅ P built (`5894ab2`): a press does nothing to the orbit, the tilt close in only.
* ✅ **2.4a built and audited** (`44ba40e`): under `chartLayout` 1 the atlas decides where a frame changes (the spec's §12.1).
* ✅ **2.4b built and audited** (`a57796e`): close in, `Scene_0`'s ridge crossed by the one transition (the spec's §12.1).
* ✅ **2.4c built and audited** (`c25a1cc` + the auditor's fix `1327ade`): one state at every change of frame (the spec's §12.1, its table).
* ✅ **2.4e built and audited** (`e14a2f0` + the auditor's completion `2fdbd34`): the calm on one reference (the spec's §12.1). **Step 2.4 is
  built but for 2.4d.**

## DECISIONS TO REVIEW — taken 2026-11-15 night while the owner slept (*"Finish everything tonight without asking me anything. Just record your decisions so I can review tomorrow morning."*)

| # | the decision | why | what undoes it |
|---|---|---|---|
| 1 | **2.4d (the trigger's band, the hysteresis) NOT built** | the owner: *"Tomorrow, we will work on the tilted-pole orbit at close in and the hysteresis"*; put to the owner before sleep: *"I agree. Proceed"* | ✅ built 2026-11-16, `42a408a` (the spec's §12.1) |
| 2 | **All of step 2.4 sits under `chartLayout` 1** (2.4e under `chartCalm` too) — no third switch; "the layout with the old detectors" (what `157974f` shows with the switch on) is no longer reachable | fewer states to compare on a device: off = the game as it was (minus the press), on = the charts | a second switch around the 2.4a – 2.4c branches |
| 3 | **Far out a pole stays the orbit's limit** (the spec's D-C6, unchanged): with the press gone, a top face, `Scene_0`'s ridge and a cap's centre are crossed CLOSE IN only (within `tiltAutoM`, 0.6 m); far out the dy stops there and the way round is a dx | D-C6 was approved with the charts; the owner removed the press knowing the tilt becomes close in only | `poleCrossingDue`'s `closeIn` condition (2.4b) for a ridge; a cap far out needs the tilt far out — the press's rule or another trigger |
| 4 | **A new gesture pushing the same way over a ridge crosses it again** | the owner's rule of 2026-11-14 (the dy hold ends with the gesture that crossed), kept as it is | a hold that outlives the gesture — the hysteresis session's |
| 5 | **The zones come from the atlas with their OWN faces as facets** (`used[].own`), not every face the whole rule adds | the wiring reads a zone's facets for the calm and the tint: with all 21 the calm would vanish on `Scene_0bis`'s body; and so the atlas's zone equals `polarZones`' there (the replay identical bit for bit) | `chartZones` |
| 6 | **The RINGS chart is not wired** | no scene leaves a face to it; a face whose home is RINGS stays on gravity's columns map, as today | its own step, with a test scene |
| 7 | **2.4c: no roll back inside the tilted frame** — leaving a tilt is ONE camera turn from the pose shown (the zones' mechanism), the frame changed at once | "two camera turns, two codes" was half of the root cause (§11); measured: `Scene_0`'s 180° one-frame roll gone | `chartLayout` 0 |
| 8 | **2.4c: at a change of frame the piece's spring and the camera's follow state are SET to the new chart's angles, their lag eased** (not kept and left to catch up) | "every angle state set" is the rule that makes the orbit's and the map's angles equal (23° – 26° apart before, 0.00° after); ⚠ its cost: under a fast dy the tilt's entry turns the view 8.5° in one frame (5.7° before) | keep each follower's lag through `seamRebase` — to judge on the device in the tilted-pole session |
| 9 | **2.4c, my fix: a transition's clock runs over the SUM of the camera's turn and the piece's direction's gap** | the two angles are unrelated; on the camera's alone the gap's rest landed in one frame (9.1°), on the longer of the two they added (8.9°) | `seamWholeRad` |
| 10 | **2.4c, by design: leaving a tilt by distance with the gizmo on the FAR half of a cap turns the camera round to that side** | the camera is derived from the place; before, it stayed and the gizmo's angles disagreed — the owner's report 4 (the gizmo on the face opposite the camera) | none without the two states again |
| 11 | **2.4e: a side face's vertical calm reads its OWN run, and is whole by position at both its own edges** — the bounce's rule (2026-11-04: the box's height for a vertical face) replaced under `chartCalm` 1 | one reference for every face (§11 3.); the owner's report 1 measured 8.1° → 4.9° a frame; ⚠ cost 1: walls of unequal extents side by side (an L-shaped tower) ease the view's pitch on a dx — no scene has them; ⚠ cost 2: `Scene_1`'s and `Scene_0`'s view changes by up to ~4° with `chartCalm` 1 (the old reference was the parts' box, 83 mm taller than the cube's side faces) | `chartCalm` 0; or `CalmKnobs.ownRun` / `wholeEnds` alone |
| 12 | **Nothing pushed, nothing deployed** — live is still `157974f` (step 2.3); the branch's 15 commits since `6d5f2b7` are local → ✅ DEPLOYED 2026-11-16 on the owner's word (main `902ae88`; the first try `7e49ae7` failed the gate: a doc link's label in a docs commit not re-verified — fixed `67ccac3`) | a push and a deploy are the owner's word each time | *"deploy"* — live about 4 minutes later; the default (both switches off) then differs from live by ONE thing: a press no longer tilts |
| 13 | **Step 2.5 (the old detectors and the switch deleted) not started** | it follows the owner's look on the switch-on behaviour | — |
| 14 | **The shelved fix in `git stash` left in place** | superseded by 2.4e (it was the per-face form of the same idea), but dropping a stash is not mine to do unasked | `git stash drop` in the worktree, on the owner's word |
| 15 | **`CLAUDE.md`'s status lines and `QUEUE.md`'s row not touched** | only when asked; `QUEUE.md` is 5 bytes under its budget | — |

**Found on the way, not acted on** — (a) the atlas on a tipped heptagon whose axis is 10 – 20° off the vertical takes a frame square to the axis
serving 6 faces where the old detector finds one whole upright zone (no scene; the test scenes and step 3); (b) under the charts a box whose top
leans 10° has its top built as a side under a virtual pole: 2.4b would cross from that roof onto the wall under its high edge (no scene);
(c) the replay script never pushes past `Scene_0`'s ridge close in and never tilts on its top faces: those paths are gated by the targeted
runs alone (the session's scratchpad `tilt_check.mjs`: `MODE=ridge`, `MODE=press`, `MODE=rim`, the default close-in run) — to move into
`scripts/probes/` when the walks' rules are written; (d) the replay's last-digit noise starts at frame 3 on any scene (≤ 3 × 10⁻⁹ m) — the
"unexplained difference at frame 3" noted on the shelved fix was that noise.

## 2026-11-16 — the owner's look, the band, the tilted pole's study

* **The owner's look** on main `902ae88` (P, 2.4a – 2.4c, 2.4e): *"looks on pc and mobile look good. OK with two comments"* — 1. the hysteresis: *"don't
  forget as well faces where the camera tilts when the gizmo crosses the middle (for example in scene 0bis, when coming from a triangle to the bottom
  face around the middle of the bottom face, noise can send the gizmo on one half or the other half of the bottom face and the camera keeps
  tilting)"*; 2. the tilted pole close in: *"do the same as what we have done so far"* (rules, obstacles and fallbacks, a systematic design from what
  Blender or others solved, an audit of the scripts and code).
* ✅ **2.4d built and audited** (`42a408a`, an Opus agent): the spec's §12.1 — the tilt made / left 21 → 0 and the view 1 188° → 0° for a place
  wobbling ±2.5 mm across the cube's top edge; the square camera's target 20 → 0 flips across a vertical edge. ✅ Deployed 2026-11-16 (the owner: *"Deploy"*): `ab5968c` merged as main `f1e03d3`, live.
* ⭐ **Comment 1 measured, NOT patched**: with a straight finger and no noise the gizmo veers across the middle of `Scene_0bis`'s bottom face, the
  half turn runs and the dy hold blocks the rest of the drag (3 of 3 runs, the game before the charts too). Cause: the spit swaps the finger's axes
  and turns its heading in the middle of that face — a band cannot fix it (the study's §4.1).
* ⭐ **The study**: `Claude/40_RENDER_SCENE/spec/TILTED_POLE_CLOSE_IN.md` — 12 rules from the owner's words; the one obstacle and 13 cases (overcome,
  or a fallback); the design (carry the heading across a FREE face, anchor it to gravity on a BOUND one, pay the difference as one turn at the
  edge — the ViewCube's published rule, a frame field's bookkeeping); the audit (12 weaknesses, W1 – W12); seven decisions for the owner (D-T1 –
  D-T7); the build's steps C0 – C5. ⛔ PROPOSED — nothing of it is built.
* **The probes written for this** (the session's scratchpad, to move into `scripts/probes/` with the walks' rules): `mid_check.mjs` (the arrival on
  `Scene_0bis`'s bottom face from a tip), `edge_noise.mjs` (a place wobbling across an edge, close in).
* ✅ **D-T2 agreed** (the owner, 2026-11-16: *"D-T2: agreed"*, after the plain-words account of comment 1): a spit's level faces on the carried
  heading — no turn in the middle of `Scene_0bis`'s bottom face, the half turn at its far edge, the picture kept when coming in from a tip; N1 / N2
  far out still to judge. D-T1, D-T3 – D-T7 open. Next: the study's C0 (the offline round, the two variants drawn).
* ✅ **C0 run** (the study's §7; `scripts/probes/free_face_study.ts`): 41 free faces on the 35 shapes, their exits' turns pure polygon geometry
  (a rectangle 0 / 90 / 180°; a wedge's triangle 100° — W6's gap); `Scene_0bis`'s bottom face modelled far out — today 89° and 180° of picture turn
  with no edge under the gizmo and 10 samples against the finger; the carried heading 0 – 1° and none, the half turn at the far edge.
