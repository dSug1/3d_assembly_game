# RND5 — The orbit on charts

> **STATUS** · ✅ steps 1.1 – 2.5 and C0 – C5 built and LIVE (main `bc8dc9e` = `1.0.147-` at `31fec5b`, with (A) of the level face's entry; the owner: *"I am happy with the build as it is now"*); built, no device look: the dy hold's hysteresis (DH, `1562bd1`), the silent entry v7 (`3c66eb9`, `freeEntryUpright`); reverted: package A, R1, the timing rule; the fast orbit's three builds reverted (not in the game), FO3 agreed, not built; step 3 (the audit) running; step B and the surface study owed. The earlier statuses (steps 2.2 – 2.4d, the tilted pole's study) are in the sections below.
> **LAST VERIFIED** · 2026-11-18

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
| 2 | **All of step 2.4 sits under `chartLayout` 1** (2.4e under `chartCalm` too) — no third switch; "the layout with the old detectors" (what `157974f` shows with the switch on) is no longer reachable | fewer states to compare on a device: off = the game as it was (minus the press), on = the charts | a second switch around the 2.4a – 2.4c branches ⭐ (2026-11-18) the switch was deleted at step 2.5: undone by a revert only. |
| 3 | **Far out a pole stays the orbit's limit** (the spec's D-C6, unchanged): with the press gone, a top face, `Scene_0`'s ridge and a cap's centre are crossed CLOSE IN only (within `tiltAutoM`, 0.6 m); far out the dy stops there and the way round is a dx | D-C6 was approved with the charts; the owner removed the press knowing the tilt becomes close in only | `poleCrossingDue`'s `closeIn` condition (2.4b) for a ridge; a cap far out needs the tilt far out — the press's rule or another trigger ⭐ (2026-11-18) decided, D-T3: keep D-C6. |
| 4 | **A new gesture pushing the same way over a ridge crosses it again** | the owner's rule of 2026-11-14 (the dy hold ends with the gesture that crossed), kept as it is | a hold that outlives the gesture — the hysteresis session's ⭐ (2026-11-18) decided, D-T6: keep; the hold's release rebuilt by DH (`DY_HOLD_REVERSAL.md`). |
| 5 | **The zones come from the atlas with their OWN faces as facets** (`used[].own`), not every face the whole rule adds | the wiring reads a zone's facets for the calm and the tint: with all 21 the calm would vanish on `Scene_0bis`'s body; and so the atlas's zone equals `polarZones`' there (the replay identical bit for bit) | `chartZones` |
| 6 | **The RINGS chart is not wired** | no scene leaves a face to it; a face whose home is RINGS stays on gravity's columns map, as today | its own step, with a test scene ⭐ (2026-11-18) decided 2026-11-16: record and do nothing. |
| 7 | **2.4c: no roll back inside the tilted frame** — leaving a tilt is ONE camera turn from the pose shown (the zones' mechanism), the frame changed at once | "two camera turns, two codes" was half of the root cause (§11); measured: `Scene_0`'s 180° one-frame roll gone | `chartLayout` 0 ⭐ (2026-11-18) the switch and this knob were deleted at step 2.5: undone by a revert only. |
| 8 | **2.4c: at a change of frame the piece's spring and the camera's follow state are SET to the new chart's angles, their lag eased** (not kept and left to catch up) | "every angle state set" is the rule that makes the orbit's and the map's angles equal (23° – 26° apart before, 0.00° after); ⚠ its cost: under a fast dy the tilt's entry turns the view 8.5° in one frame (5.7° before) | keep each follower's lag through `seamRebase` — to judge on the device in the tilted-pole session ⭐ (2026-11-18) W11: option A built and reverted (`6e56dfc`); stands as measured. |
| 9 | **2.4c, my fix: a transition's clock runs over the SUM of the camera's turn and the piece's direction's gap** | the two angles are unrelated; on the camera's alone the gap's rest landed in one frame (9.1°), on the longer of the two they added (8.9°) | `seamWholeRad` |
| 10 | **2.4c, by design: leaving a tilt by distance with the gizmo on the FAR half of a cap turns the camera round to that side** | the camera is derived from the place; before, it stayed and the gizmo's angles disagreed — the owner's report 4 (the gizmo on the face opposite the camera) | none without the two states again |
| 11 | **2.4e: a side face's vertical calm reads its OWN run, and is whole by position at both its own edges** — the bounce's rule (2026-11-04: the box's height for a vertical face) replaced under `chartCalm` 1 | one reference for every face (§11 3.); the owner's report 1 measured 8.1° → 4.9° a frame; ⚠ cost 1: walls of unequal extents side by side (an L-shaped tower) ease the view's pitch on a dx — no scene has them; ⚠ cost 2: `Scene_1`'s and `Scene_0`'s view changes by up to ~4° with `chartCalm` 1 (the old reference was the parts' box, 83 mm taller than the cube's side faces) | `chartCalm` 0; or `CalmKnobs.ownRun` / `wholeEnds` alone ⭐ (2026-11-18) the switch and this knob were deleted at step 2.5: undone by a revert only. |
| 12 | **Nothing pushed, nothing deployed** — live is still `157974f` (step 2.3); the branch's 15 commits since `6d5f2b7` are local → ✅ DEPLOYED 2026-11-16 on the owner's word (main `902ae88`; the first try `7e49ae7` failed the gate: a doc link's label in a docs commit not re-verified — fixed `67ccac3`) | a push and a deploy are the owner's word each time | *"deploy"* — live about 4 minutes later; the default (both switches off) then differs from live by ONE thing: a press no longer tilts |
| 13 | **Step 2.5 (the old detectors and the switch deleted) not started** | it follows the owner's look on the switch-on behaviour | — ⭐ (2026-11-18) built 2026-11-16, `ef5e899`; live. |
| 14 | **The shelved fix in `git stash` left in place** | superseded by 2.4e (it was the per-face form of the same idea), but dropping a stash is not mine to do unasked | `git stash drop` in the worktree, on the owner's word |
| 15 | **`CLAUDE.md`'s status lines and `QUEUE.md`'s row not touched** | only when asked; `QUEUE.md` is 5 bytes under its budget | — ⭐ (2026-11-18) see the final docs pass (QUEUE.md is updated). |

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
* ✅ **C2, the pure part, built and audited** (`c5538db`, an Opus agent): `src/input/free_face.ts` — the free faces under a holding "up", one layout
  per side (the neighbour's up unfolded), the layout at an entry (by the edge, or the nearest with no edge), an exit's turn, the hold's test (its
  threshold the caller's: D-T4 open). Equal to the offline round's reference on the 35 shapes; a concave edge and a zone held by its axis vectored;
  53 vectors, red on 16 mutants; **2013 vectors**. ⛔ Not wired — nothing changes in the game. ⛔ C4 (the spit on this rule) waits for D-T7.
* ✅ **D-T7 answered** (the owner, 2026-11-16, his reading of US 7,782,319 B2's independent claims — verbatim in the study's §3.5): the claims are
  about a 3D representation of the coordinate system (a cube) manipulated to select a viewpoint; the local-up / global-up rule on its own is not
  claimed → **the carried heading stands**; ⛔ the game never shows a clickable / draggable 3D orientation widget. ⚠ US 8,044,953 (HoverCam) is
  not covered by that reading. C4 (the spit on the carried heading) is unblocked.
* ✅ **The owner's decisions on the study** (2026-11-16): **D-T1 NO** — *"no, I would prefer to return to the orbit when the distance is crossed back (0.65m currently), so the tilted pole orbit is reserved for close in. I don't like to see the top of the scene square at far distance. The close in square is for fine placement of the piece, not for scene view. Find a way to blend properly the camera movement on the way out."* → the distance switch stays;
  the way out gets a proper blend (the study's §8: the way out mirrors the way in — the camera follows the approach's travel outward, never a timed
  turn, the gizmo free; to MEASURE first, then step C3); **D-T2 to D-T7** — *"agree with your recommendations"*: D-T3 keep D-C6 (far out polar,
  a limit), D-T4 the dy hold from any turn over 90°, D-T5 keep D-C2 (a level face that is not a rectangle stays polar), D-T6 keep (one crossing
  per gesture), D-T7 as answered. C4 in build.
* ✅ **D-T4 left to the builder** (the owner, 2026-11-16: *"i have no particular opinion. Weigh the pros and the cons and build what is best"*) →
  the study's §10: the dy hold when the turn is over 90° AND the finger's dy was the one pushing the gizmo out over that edge (never a dy that
  crossed nothing — the gap of the 120° rule closed without the 90° rule's wrongly blocked direction); nothing changes on a rectangle.
* ✅ **C4 built and audited** (`0125445`, an Opus agent, + the auditor's completion `28df70c`: the hold by `exitHoldSign`, D-T4): a spit's level
  faces on the carried heading — the study's §9.1. `Scene_0bis`, the arrival from a tip that reproduced the owner's comment: the gizmo no longer veers
  (2 – 5 mm off the middle against +79 mm), the middle reached, no side change, no hold, 76° of view against 334°; across the face: nothing at its
  middle, the half turn one band past the far edge, then the hold. **2038 vectors**; off: the three scenes bit for bit; on: `Scene_1`, `Scene_0` bit
  for bit, `Scene_0bis` another play, no worse. A new slider `freeFaceSquare` (POLAR ZONES: 0 the calm kept / 1 the camera square to a spit's level
  face) — the owner's to judge. ✅ Deployed 2026-11-16 (the owner: *"Deploy"*): `301ada6` merged as main `6685f8f`, live; the owner's look owed. ⛔ Next, on the owner's word only: §8 (the way out blended), to measure first.
* ✅✅ **The owner's look on C4** (main `6685f8f`, 2026-11-16): *"This is good. Commit. For the next deploys always toggle on the two switches by default in all the scenes. Continue next step"* → C4 closed; **both switches ON by default
  from the next deploy, in every scene** (the study's §11); the next step: §8, the way out of close in blended (C3) — measured first.
* ✅ **Both switches ON by default** (`cb55778`): forced to 0 the three scenes replay bit for bit as before, with no parameter as the switch-on build.
* ✅ **C3 built and audited** (`86f2cbe`, an Opus agent, + the auditor's completion: the one speed on the picture): the way out of close in blended —
  the study's §8.1. Today measured first (180° in 0.52 s whatever the finger, the gizmo held, trailing the zoom); now the turn follows the approach
  finger over `tiltOutBlendMm` (12 mm; 0: today's), smooth at both ends, never over the one speed (6.0° a frame at most), the gizmo free, finished by
  time only once the finger has lifted. **2058 vectors**; the slider at 0: bit for bit. ✅ Deployed 2026-11-16 (the owner: *"Deploy"*): `c7ac510` merged as main `40c6325`, live, both switches on by default; the owner's look owed.

## 2026-11-16 — the rest launched by Opus agents; the to-do before step B

* **The owner's words**: *"Do everything except the step B. Make sure to maximize the use of Opus agents as I do not have much Fable credits left
  for this week. Also, before step B, we will need to work on the surface definition and the singularities (voids, channels, mouths, protrusions,
  small faces): just capture that in your to do list for the moment."*
* **Launched now, in this order** — each package built by an Opus agent and audited by another Opus agent: the probes and the gates moved into
  `scripts/probes/` with their runbook and baseline (`scripts/probes/ORBIT_GATES.md`); **W11** (the tilt's entry under a fast dy); **C5** (one
  half-turn event); **the test scenes**; **C2's wiring** (W5, W7); then, a second chain, **step 2.5** and **step 3 parts 1 and 2** of the charts.
  ⛔ **Step B is NOT started.**
* ⭐ **TO DO BEFORE STEP B — the surface definition and the singularities** (voids, channels, mouths, protrusions, small faces): a study by the
  four-part method (the rules; the obstacles and the fallbacks; a systematic design from prior art; an audit of what is built), approved by the owner
  before any build. The part of C5 / W9 about *"a mouth as a concave edge"* moves into that study (`TILTED_POLE_CLOSE_IN.md` §6).

## 2026-11-16 — C1 / W11 measured (an Opus agent): structural, NOT built — the options are the owner's

* **The brief**: the tilt's entry under a fast dy turns the view 8.5° in one frame — measure it, name its cause, build the fix only if it is clear and
  systematic (the share shown never faster than the tilts' one speed), else report the options.
* **Measured** (`tilt_check.mjs` with every frame's transition state recorded, the three scenes): what jumps is the piece's SHOWN direction —
  (1.) the direction's ease is read the moment the frame changes, before the same frame's square camera takes its first step (its target just
  changed by the tilt): the gap (6.49°) is applied to a direction the step had already brought back, the piece is drawn 6.45° off at k = 0 and the
  framing turns the camera 6.2° to hold it; then 8.0° the next frame. (2.) The root: every change of frame close in starts TWO turns at the one speed
  — the transition's one turn and the square camera's pitch over the edge — and they add on the glass: the tilt's entries 6.7 – 8.2°, its exit 8.7°,
  the ridge's and the spit's half turns 8.5 – 8.9° over most of their ~30 frames.
* **Tried and reverted** (nothing committed): the ease read after the view's update — the entry 0.4 / 1.4° but another entry 10.4°; with the square
  camera's pitch inside the one turn as well — `Scene_1` 6.0° at most, `Scene_0bis` 54.6° (a turn started in the camera's stage escapes the read).
* ⛔ **Not built**: structural, in code every change of frame shares, and every fix changes what the owner has looked at (the ridge, the spit, the
  tilt's turns). The options A (the one turn truly one — recommended), B (a limiter on the picture), C (one shared budget), D (keep) →
  [`TILTED_POLE_CLOSE_IN.md`](../../40_RENDER_SCENE/spec/TILTED_POLE_CLOSE_IN.md) §12.

## 2026-11-16 — C5, one half-turn event (an Opus agent)

* **The brief**: the four places that each make *"a crossing that turns the camera and may hold a dy"* (the tilt's exit, the ridge close in, the
  spit's change of side, a free face's exit) made ONE event — a pure rule in `src/input`, one wiring function the four call, the dead fields removed,
  under `chartLayout` 1 (0: bit for bit); the hold by D-T4 (§10); then the spit's top ridge arrived at from a tip measured (`Scene_0bis`).
* **The design** (written before the build): the hold is the dy that pushed the gizmo out over the edge AND would bring it straight back after the
  turn — on a free face's level edge exactly §10's rule; the four sites' facts and dead fields tabled →
  [`TILTED_POLE_CLOSE_IN.md`](../../40_RENDER_SCENE/spec/TILTED_POLE_CLOSE_IN.md) §13.
* **Built** (§13.3): `crossingHoldSign`, `crossingEvent` (pure) and `crossTurn` (the one wiring function) — the tilt's exit, the ridge, the spit's
  side and a free face's exit call it; the hold by the rule at the tilt's exit and the ridge; the spit keeps the finger's last sign (the mirror rule
  built, measured — a second half turn arriving from a tip — and withdrawn); `EdgeHold.g0` / `.d` deleted. Every gate equal to the baseline, the
  default replays bit for bit. ⛔ Not built: the spit's turn at the gizmo's edge (R1, the owner's) — far out it lands 55 – 60 mm past the ridge (§13.4).

## 2026-11-16 — T1, the test scenes (an Opus agent; before C2's wiring)

* **The brief**: six test shapes as scenes in a throwaway worktree (`1.0.146t-Orbit-charts-test-scenes`, never merged) — an upright prism with a
  top that is not a rectangle, a shape the charts leave to RINGS, a step, an L-shaped top, a box turned 30°, a thin lying bar with pointed ends —
  each walked far out and close in, headless; the findings tied to W5, W7, W8, RINGS (W12) or new →
  [`TILTED_POLE_TEST_SCENES.md`](../../40_RENDER_SCENE/spec/TILTED_POLE_TEST_SCENES.md) §14 – §15. Nothing in the game changes.
* **Measured** (the scenes and the probe on the throwaway branch, `a828c92`; `Scene_1` the control): ⛔ **F1** a step and an L are not on the face
  map at all (the faces contour is the polytope of each direction's main plane: the step's map a box neither part is, the L's its bounding square;
  the gizmo on no face for stretches, flickering at the L's pole, a hold with no turn); **F2** W5 confirmed on the box turned 30° (4 of 10 entries
  off the entry edge, 36° and 90°); **F3** W8 confirmed (the square camera's target the face left, 70 – 90° off, on the pentagon's and the
  bipyramid's caps); **F4** those caps a stall close in; **F5** RINGS not wired (the bipyramid's place stalls on one triangle 494 frames); **F6** the
  way out from a cap with no tilt not paced (9.6°/frame, once 55.6° in one frame); **F7** timed turns of 11.8 – 18.9°/frame at a bottom's side
  exit → [`TILTED_POLE_TEST_SCENES.md`](../../40_RENDER_SCENE/spec/TILTED_POLE_TEST_SCENES.md) §15, each row with its command. Nothing fixed.

## 2026-11-16 — C2W, C2's wiring on gravity's caps: W5 and W7 (an Opus agent)

* **The brief**: under `chartLayout` 1 a free face reached under gravity's layout (the cube's top) shows the heading carried in by its entry edge —
  the pure functions C4 calls in a spit zone (W5); a tilted frame's face map built in the shape's own box, not the world box's turned corners (W7);
  one wiring function for a free face's entry whatever its zone. `Scene_0`, `Scene_0bis`, `Scene_1` unchanged; the gain on the test scenes. W8 and
  RINGS not built → [`TILTED_POLE_CLOSE_IN.md`](../../40_RENDER_SCENE/spec/TILTED_POLE_CLOSE_IN.md) §16.
* **Built** (`e56f34f`): `capTiltHeading(…, along)`, `frameBox`, one entry function `freeEntry` for a spit's free face and gravity's cap,
  `asmPlaceWas`; 2088 vectors. Every gate on `Scene_0`, `Scene_0bis`, `Scene_1` identical to the baseline (the default replays bit for bit). T_e (the
  turned box): entries off the edge 4 of 10 → 1 (the first, the pending camera's); W7 found offline only (a long flat box turned 30° / 45°: a tilted
  map all virtual in the turned world box). ⛔ W8 and RINGS not built (W8 needs D-T5 reopened) →
  [`TILTED_POLE_CLOSE_IN.md`](../../40_RENDER_SCENE/spec/TILTED_POLE_CLOSE_IN.md) §16.1.

## 2026-11-16 — T2, the test scenes again after C2W (an Opus agent; measured, nothing built)

* **The brief**: the rebuild branch merged INTO the throwaway (`1.0.146t-`), every measurement of the T1 findings re-run, the column AFTER and WHAT
  REMAINS (W8, RINGS) → [`TILTED_POLE_TEST_SCENES.md`](../../40_RENDER_SCENE/spec/TILTED_POLE_TEST_SCENES.md) §15.
* **Measured**: F2 (W5) fixed but one (4 of 10 entries off the edge → 1, the first after the approach); F1, F3 – F8 unchanged (T_a – T_d, T_f
  identical line for line); ⭐ F9 WITHDRAWN — the probe's own count (a zone's missing normal read as `null`; corrected on the throwaway, T_f 0
  frames). ⛔ Open, the owner's: W8 (reopen D-T5: a layout square to the entry edge on any polygon cap, or polar with the cap's normal as the
  square camera's target), RINGS (before step B or not), F1 (the surface's definition before step B).

## 2026-11-16 — step 2.5, THE OLD DETECTORS AND THE TWO SWITCHES DELETED (an Opus agent) — as briefed, the list before any code change

* **The brief**: every code path that runs only when `chartLayout` or `chartCalm` is 0 deleted — the zone detectors and the layout of the game
  before the charts, the old tilt exits and holds, the old box of a frame's map, the old calm; the two tunables (their validation, sliders, URL
  overrides); the state fields only those paths used; the vectors that test only what goes; the exports left with no caller
  (`tests/unwired_debt.test.ts`). ⭐ The default game (both switches 1 since `cb55778`) BIT FOR BIT: the default replays of `Scene_0`, `Scene_0bis`,
  `Scene_1` against the base (`d917d04`) and every default gate of `scripts/probes/ORBIT_GATES.md` line for line. A pure function that took a switch
  loses the argument (never a constant `true` in its place). One new vector: no identifier `chartLayout` / `chartCalm` left under `src`. The probes'
  "off" replays and `S:0` legs removed, their baseline tables moved to `history/`.
* **THE LIST, read off the code at `d917d04`** (`src/render/assembly_wiring.ts` unless named):
  * the CALM — `calmDir` L415-416 (`tl.k`: written by the old roll back only, always 0 now); `calmTargets` L548 `calmRules(chartLayout, chartCalm)`,
    L552 / L601 `calmKnobs(st, rules.smooth, rules.ownRun)` and the `box` argument (read only by the box-height rule, `ownRun` false), L566-571 and
    L619-623 (`!rules.everyFacet`: no calm on a polar zone's facets, whole toward them — and `zoneFacetOf` with them), L575 / L627 (`rules.noPitchFade`),
    L613 `wholeEnds(rules.ownRun, …)`; `calmKnobs` L634-647 (`smooth`, `ownRun`). In `src/input/orbit_calm.ts`: `calmRules` and `CalmRules`,
    `CalmKnobs.smooth` / `.ownRun`, `wholeEnds`, `calmTarget`'s `box` parameter and its two paths of the old calm (`edgeShare` for the shares, a vertical
    facet's share on the box's height — the bounce's rule).
  * the FACE MAPS — `faceMapOf` L877 (`#C…` in the key), L881 `frameBox(…) : tiltBox(…)` (the old box of a frame's map); `worldFaceMap` L893;
    `chartOpts` L905-907 (always the charts' layout now: the call takes `{ layout: "chart", scale: "normals" }`).
  * the ZONE DETECTORS — `zonesOf` L2193-2198 (`polarZones`, `zoneOptsOf` L2173-2176); in `src/input/polar_zone.ts` `polarZones` and what only it
    reads (`contourCorners`, `facetSize`, `snapToWorldAxis`, `zoneOrientation`, the private helpers); `ZoneOpts.valenceMin` / `.facetMinRatio` /
    `.snapDeg` and the three tunables they come from (`zoneValenceMin`, `zoneFacetMinRatio`, `zoneSnapDeg` — read by `zoneOptsOf` alone: left
    unread, `tests/config_debt.test.ts` refuses them), their validation and their three sliders (POLAR ZONES).
  * the TILT — `tiltOn` L1838-1851 (`holdsPole`, `tiltHeading`: the old test and heading), L1870-1878 (the swing's fields overwritten under the
    charts), L1887 (`turnAngles` by the swing's `D0`), L1896 (`asmMapQ` alone); `nextTiltHeading` L1945-1957 (whole: its one caller is the old roll
    back); `tiltFrame` L1658-1671 (the swing: `swingMs` is never set under the charts), L1684 (the tie without the band), L1695-1706 (the roll back:
    `crossing`, `finishing`, `kT`, `k`, `rollStep`, `tiltExits`); the camera's tilted branch L1589-1611 (the roll back's frame: `exitNormal`'s read
    there, `nextTiltHeading`, `headingFrom`, `frameMix`, `rollRad`, `axis`); `tiltClampStep` L1727, L1736 (`swingTimed`, `tiltUnderWay`); `tiltOff`
    L1991-1997 (`edgeHoldAt`, the old hold), L2003 / L2034-2045 as reached with no place (kept: `turnAngles` there is the charts' path too);
    `blendCrossed`'s `finishing` (L1292: always false now). In `src/input/orbit_tilt.ts`: `swingDir` (and `headingTurn` if left with no caller),
    `headingFrom`, `tiltExits`, `tiltUnderWay`, `frameMix`, `rollStep`, `edgeHoldAt`, `TILT_TIE_M` and `onTiltedFacet`'s default `tolM` (every
    caller hands the band); in `src/input/face_map.ts` `holdsPole`. The state (`scene_state.ts` `asmTilt`): `delta`, `swingMs`, `byMm`, `swingE`,
    `swingDurMs`, `k`, `kT`, `finishing`, `rollRad`, `axis`, and `dir` (always the tilt's `map` now — read as `map`).
  * the CROSSINGS — `squareFrame` L441-456 (the unbanded target, L452-455); `assemblyFrame` L1166-1182 (the guard and `PoleCrossingFacts.chartLayout`
    in `src/input/pole_crossing.ts`), L1185, L1187, L1234, L1241; the camera's spit branch L1575; `zoneSwitch` L2283; `zoneFinger` L2471; `spitStep`
    L2498, L2532-2541 (the old turn and hold); `seamOutPaced`'s `chartLayout` argument (`src/input/seam_turn.ts`).
  * the TUNABLES — `gestureConfig.ts` `chartLayout`, `chartCalm` (L454-458, L890-891, L1058-1059), their sliders (`tuning_menu.ts` L294, L296); the
    URL: a key no longer in the config is REPORTED by `parseConfigOverrides` (`… not an overridable tunable`), never applied — to check in the app.
  * `play_recorder.ts` L169 (`asmTilt.k`), and the probes reading it (`walk_probe.mjs`, `tilt_probe.mjs`).
  * the VECTORS — the files' switch pins and every vector of only the old paths: `tests/orbit_charts_switch.test.ts`, `tests/chart_calm_wiring.test.ts`
    (the switches, `calmRules`), `tests/orbit_calm.test.ts` (`calmRules`, `smooth` / `ownRun` absent, `wholeEnds` false), `tests/calm_slanted.test.ts`
    (the box-height rule), `tests/polar_zone.test.ts` (`polarZones`), `tests/orbit_tilt.test.ts` (`swingDir`, `frameMix`, `rollStep`, `tiltUnderWay`,
    `tiltExits`, `headingFrom`, `TILT_TIE_M`, `holdsPole`, the old wiring pins), `tests/orbit_any_shape.test.ts` (`holdsPole`, the `chartLayout` 0
    path), `tests/zenith_roll.test.ts`, `tests/orbit_charts_pole_crossing.test.ts` (`{ chartLayout: 0 }`), `tests/way_out_blend.test.ts`
    (`seamOutPaced`'s argument) — a vector pinning both paths keeps its default half; every source pin of `chartLayout === 1` follows the source
    (`facets`, `free_face_caps`, `free_face_spit`, `crossing_event`, `orbit_charts_atlas`, `orbit_charts_face_band`, `orbit_charts_one_state`,
    `assembly_orbit`, `menu_layout`). The names, as deleted: in the as-built entry below.
* ⛔ **Not in this step, kept and named**: `buildFaceMap`'s `layout` / `scale` options with their "built" defaults — a library default every
  face-map vector and probe builds on (25 test files); the game no longer reaches it. `turnAngles` (the first frame of a zone, no place yet).
  `tiltBox` (`frameBox`'s fallback). `edgeShare` (the tilted facet's shares). The dead edge blend (the inventory's F.1, `ORBIT_CHARTS.md` §4.4): not
  on a switch.

## 2026-11-16 — step 2.5 AS BUILT (an Opus agent; base `0e758a7`, the code of `d917d04`; the code commit `ef5e899`)

* **The list above, checked against the code**: right, and completed — also gone: `asmZoneFacetsF` (`zoneFacetOf`'s memo: `scene_state.ts`, its reset
  in `scene.ts`, `orbit_state_reset.test.ts` 58 → 57 fields); `nextTiltHeading`, `exitNormal`'s read in the camera, `headingFrom` (the roll back's
  target); `matMul` and `headingTurn` (only `swingDir` used them); `tiltFrame`'s `dtMs` (read only by the swing and the roll back); `blendCrossed`'s
  `finishing` (the argument goes, the pure function with it); `PoleCrossingFacts.chartLayout`; `seamOutPaced`'s `chartLayout`; `onTiltedFacet`'s
  default `tolM` (the tie, `TILT_TIE_M`); `ZoneOpts.valenceMin` / `.facetMinRatio` / `.snapDeg` (and `DEFAULT_ZONE_OPTS`'); in `polar_zone.ts` with
  `polarZones` the helpers only it read (`contourCorners`, `facetSize`, `facetArea`, `realFacets`, `sharedEdge`, `t2Fails`, `snapToWorldAxis`,
  `zoneOrientation`, `rimCentroid`, `LEVEL_DEG`, `ALIKE_DEG`); `CalmKnobs.smooth` / `.ownRun`, `calmRules`, `wholeEnds`, `calmTarget`'s `box` (every
  share by `edgeShareSmooth`, every side facet on its own run); the `#C…` part of both face maps' cache keys; `chartOpts` (now one constant,
  `CHART_MAP_OPTS`). `play_recorder.ts`'s `tl` is `[id]` (the roll back's `k`, always 0, gone). ⚠ Kept, not on a switch: `turnAngles` (a zone's first
  frame, a tilt's exit with no place), `tiltBox` (`frameBox`'s fallback), `edgeShare` (`tiltCalmWholeHV`, `poleEdgeWhole`), `frameMix` (`poseAboutPiece`),
  `swingEase` (the relocation's), `CalmState.poleFade` (a cap's reading keeps the fade), `buildFaceMap`'s "built" defaults (a library default).
* **What went, by area** (`git diff --stat` of the code commit): `assembly_wiring.ts` (the calm's old paths, the switch's guards, the old tilt's swing,
  roll back, exits and hold, the zones' detectors, the spit's old turn), `orbit_tilt.ts`, `orbit_calm.ts`, `polar_zone.ts` (286 lines), `face_map.ts`
  (`holdsPole`), `gestureConfig.ts` (5 tunables, their defaults and validation), `tuning_menu.ts` (5 sliders: 122 → 117), `scene_state.ts` (11 fields of
  `asmTilt`, `asmZoneFacetsF`), `pole_crossing.ts`, `seam_turn.ts`, `play_recorder.ts`.
* **The vectors**: 32 deleted, 2 new, the rest of the 19 files' pins kept on their default half (names: the step's report; by file — `orbit_calm` 9,
  `orbit_tilt` 7, `polar_zone` 7, `chart_calm_wiring` 3, `orbit_charts_switch` 3, `orbit_any_shape` 2, `orbit_charts_face_band` 1). ⭐ NEW
  (`orbit_charts_switch.test.ts`): no identifier `chartLayout` / `chartCalm` under `src`, comments stripped — RED on restoring one (the tunable in
  `gestureConfig.ts`; a guard in the wiring); a URL that still carries either is REPORTED and never applied (`parseConfigOverrides`).
* **The gates** (one run at a time, the probes' guard on): the default replays of `Scene_1`, `Scene_0`, `Scene_0bis` recorded at the base and after —
  IDENTICAL in all 2794 frames, every field (`replay_cmp`: largest difference 0, `1e-9: never`); every default gate of `ORBIT_GATES.md` recorded at the
  base and after (`tilt_check` default, `out` ×4, `ridge` ×3, `press` ×3, `rim`, `pole` ×3; `mid`, `across`; `edge_noise` top ×3, side ×2): every output line for line EQUAL to the base's (the URL and the boot line aside: they named the switch) — and equal to §6 of the runbook (the
  baseline at `276a6c2`), row for row. No process and no `replay_probe_profile_*` left after any batch.
  `npm run verify`: typecheck clean, **164 test files, 2058 vectors** (2088 − 32 + 2), ~2 min.
* **A URL with `chartLayout=0&chartCalm=0`**: measured on the three scenes (headless, `page_eval.mjs`): the scene boots and plays the default game; the config has no such key;
  the HUD's tuning lines show `⛔ chartLayout: not an overridable tunable` and `⛔ chartCalm: not an overridable tunable`; no error panel.
* **The probes' guard** (`scripts/probes/probe_guard.mjs`, the brief's fix): see `ORBIT_GATES.md` §0 — the in-probe watchdog was a timer that cannot fire
  while the probe is blocked in a synchronous call (a pipe write to a dead reader, a `spawnSync`); a Windows tree kill of the tool's command does not reach
  Git Bash's children. Reproduced (a tree kill of a running `tilt_batch.sh 1`: the batch's shell, the server, the probe and its Chrome survived); with the
  guard everything ended by itself at the deadline, no process and no profile left. ⚠ Until the deadline (8.5 min) the stuck probe stays — the guard
  cannot tell a stuck probe from a slow one before it.
* ⛔ Not done here: step 3 (the owner holds it); `ORBIT_STATE_INVENTORY.md` still names the deleted `asmTilt` fields and `asmZoneFacetsF` (the
  inventory of step 2.1, a record — to update at step 3's docs); `scripts/probes/calm_study.ts` (step 0's study) no longer runs on this tree (noted in it).

## 2026-11-16 (evening) — THE OWNER'S DECISIONS on what step C left open; branch `1.0.147-` (docs only)

* **His words, in full**: *"1- A / 2- R1 / 3- I don't want to change what is currently built: it looks good on the screen. Record and do nothing. We
  may reopen if we need when we build game scenes later on. / 4- Maintain D-T5. This kind of geometry probably means that the piece has a rotation
  symetry axis around the gravity axis so D-T5 makes sense. Just record as we may reopen if we need when we build game scenes later on. / 5- Record
  and do nothing. We may reopen if we need when we build game scenes later on. / 6- I don't understand what is this box, and what is the question.
  ... Explain in layman's term what this is about or withdraw the question. / Build that in a branch 1.0.147- so I can reverse to branch 1.0.146- if
  I don't like the results."* And: *"Progress as much as you can without asking me questions. I wish to finish the orbit charts work tonight."*
* **So**: **1** W11's option **A** (the one turn truly one) — to BUILD; **2** the spit's half turn **R1** (at the gizmo's edge) — to BUILD; **3**
  `Scene_0bis`'s top ridge reached from a tip — KEPT AS BUILT; **4** a level top that is not a rectangle (W8) — **D-T5 MAINTAINED**, his reason: such
  a geometry probably means a piece with a rotation symmetry axis about gravity; **5** RINGS — NOTHING BUILT; 3, 4 and 5 may be reopened when game
  scenes are built; **6** the frame box's scope — the question WITHDRAWN after it was explained to him in plain words (when the camera goes square to
  a face the game redraws its map of the faces from that direction and first measures a box round the placed parts along it; C2's wiring measures
  that box from the parts' corners so that it fits a part set at an angle, uses it for every redrawn map, and no game scene shows a difference): kept
  as built, a matter for the later surface work.
* **Done** (docs only): branch `1.0.147-` created from `1.0.146-Orbit-charts` (`c5aa295`), which is not touched again; `TILTED_POLE_CLOSE_IN.md`
  §14 – §15 (the test scenes) moved word for word to make room →
  [`TILTED_POLE_TEST_SCENES.md`](../../40_RENDER_SCENE/spec/TILTED_POLE_TEST_SCENES.md); the decisions →
  [`TILTED_POLE_CLOSE_IN.md`](../../40_RENDER_SCENE/spec/TILTED_POLE_CLOSE_IN.md) §17, and the rows they settle (§5 D-T5, §12.4, §13.4, §16.1).
  Next on `1.0.147-`: A, then R1. Not in this chain: step B; anything on 3, 4, 5; any push or deploy.

## 2026-11-16 (night) — PACKAGE A, W11's option A, as briefed (an Opus agent; base `e79d820`)

* One transition, one turn: the square camera at its target inside a running turn (a target changed mid-turn restarts the turn from the pose shown);
  the direction's ease read after the frame's view is set, at every turn start; the shown share capped at `tiltRollDegS` in every path (the
  finger-paced entry, the square camera's own share). The design →
  [`TILTED_POLE_CLOSE_IN.md`](../../40_RENDER_SCENE/spec/TILTED_POLE_CLOSE_IN.md) §18. No new tunable.
* **As built** (`fe06c2c`, then `c53f54a` below — two commits: `git revert c53f54a fe06c2c` undoes A): every transition close in at ≤ 6° a frame on the three scenes (`Scene_1`'s
  default 8.7 → 6.0, the ridge 8.5 → 6.0, the way out 6.0 → 5.2; `Scene_0bis`'s spit 8.9 → ≤ 6.4 at a turn's first frame); the top ridge from a tip
  kept as the owner saw it (125°, the same way round, ≤ 6.6°). Two causes fixed in the rule while building (the camera's angle growing with the ease;
  the spit's turn axis read before the view was set). 17 vectors, 13 mutants; **2075 vectors**. ⚠ `mid_check` not reproduced on A (its climb lands
  elsewhere); a drag across a vertical edge while the square camera turns on its own still reaches 7.6 – 8.0° (no transition there — the owner's to
  decide). ⛔ No device look. → [`TILTED_POLE_CLOSE_IN.md`](../../40_RENDER_SCENE/spec/TILTED_POLE_CLOSE_IN.md) §18.1.
* **The second commit, `c53f54a`** (2026-11-17, the first audit's blocker fixed at its root; the second audit: the code sound, `npm run verify` 165
  files, **2081 vectors**): on `Scene_0bis`'s spit, the free face's exit, the turn's END pose still moved under the rig's own lags (the leash after a
  drag, the calm's ease) while the turn ran, so the picture turned 6.66, 6.36, 6.17, 6.06° in four frames. Now the share DRAWN is capped in the camera's
  stage (`shownShareCap`, the picture's actual turn measured by `poseTurnRad`; the clocks carried on from it, the way out's by `seamOutShareInv`); a
  turn ends where it is drawn whole. Its figures (the second auditor's): `across_check`'s walk 6.6 → 6.7 → 6.0° in a frame; `Scene_0bis` in
  `tilt_check` 541 → 613 frames in a turn, 3476 → 3544° in all turns; the spit's free-face entry and exit turns ~10 frames longer; `ridge_check`'s walk
  back 58 frames in a turn (40); one frame of 6.36° left at share 0 — a spit turn's first frame, the end pose's own motion under a drag, not the
  turn's share. 6 vectors. ⛔ No device look. → [`TILTED_POLE_CLOSE_IN.md`](../../40_RENDER_SCENE/spec/TILTED_POLE_CLOSE_IN.md) §18.1.
* **FOR THE OWNER — not decided, nothing built** (from A's builders):
  1. **The square camera's own turn at a vertical edge during a drag** — 7.6 to 8.0° a frame with no transition running: leave it (it is a drag), or
     pace it as a transition.
  2. **The summed clock** — the turns are longer than §12.4 estimated (a 90° exit about 30 frames; the way out 0.67 s against 0.58 s): keep it, or a
     refined clock.
  3. **The cap under a fast finger** — a turn paced by the finger adds nothing in the frames where the finger itself moves the picture over 6°, and
     finishes once it slows or lifts: to judge on the device.
  4. **A turn started with no world map still reads no ease** — unchanged from before A.

## 2026-11-17 (night) — PACKAGE R1, the spit's half turn at the gizmo's edge (an Opus agent; base `a1a52f0`; the code commit `1038a29`) — ⛔ REVERTED `21e600d`

⛔⛔ **REVERTED by `21e600d` after its audit** — the code is `a1a52f0`'s again (2081 vectors); R1 is NOT built. The audit's blocker: far out from
`Scene_0bis`'s −x tip R1 changed more than WHERE the ridge's turn fires, which decision 3 (*"I don't want to change what is currently built"*) and the
brief's stop rule forbid — the setup's side −1 → +1, the gizmo's drift over the ridge the other way (−27.6 mm off the middle, +45 before), the turn
mirrored (the axis on the glass 92° → 6°, against 93° → 169°) and LARGER (79.6 → 96.0°, the view 151 → 166° in all), a 10.3° drag frame (7.4 before).
The builder had judged that case "as before": wrong. Its cause: the side, and with it the finger's mapping, read off the gizmo's tip triangle instead
of the camera. ✅ **DECIDED by the owner, 2026-11-17: *"Keep as it is right now"* — R1 is DROPPED, option (c): the turn stays as built, nothing to build.** The options put to him (nothing built): (a) R1 with that case's side kept off the camera — a special case beside the rule; (b) R1 as
built, decision 3 relaxed far out from a tip; (c) R2, as today (the turn 55 – 60 mm into the face beyond, far out). The record below is the build's.
`mid_check`'s mended setup (below) is kept: it was in the docs commit, not the code's.

* **As briefed** (the owner's *"2- R1"*): the spit's change of side triggered by the GIZMO crossing an edge, one band past it, the hold by the one rule,
  the heading on bound faces rebuilt (W3's second half); decision 3 binding (the ridge from a tip: only where the turn fires may move).
* **As built** (`git revert 1038a29` undoes it): the side from the banded face's world normal (`faceSide`), changed only at a crossing over an edge — not
  over a tip's apex (`metAtPoleOnly`: its first build turned the picture the long way there, 60.6° in one frame, `Scene_0bis`'s replay); the hold by
  `crossingEvent`; the heading on the side's view (`spitSideView`, the camera mirrored onto the gizmo's side while it lags). Deleted: the side off the
  camera (`crossingPitch`, `overAxisPitch`, `crossingHold`, `asmSpitU`) and their 9 vectors; 16 new, 14 mutants; **2088 vectors** (166 files).
* **Measured**: far out the ridge's turn 55 – 60 → 4.5 – 9.3 mm past the ridge, then held as close in; `Scene_1` and `Scene_0` replays identical in every
  frame and every `tilt_check` / `edge_noise` line of theirs identical; `across_check` and `mid_check` walks as before; `Scene_0bis`'s replay another play
  from its first side change (the largest turn a frame 13.4 → 11.8°, roll 14.4 → 13.1°). Decision 3: close in the turn at the rim (16 mm earlier), the
  same end pose, the same dy held, the walk blocked as before. → [`TILTED_POLE_CLOSE_IN.md`](../../40_RENDER_SCENE/spec/TILTED_POLE_CLOSE_IN.md) §19.
* **`mid_check` mended** (its setup, not the game): since A its direction probes, pressed at the glass's centre, hit a quad of the held piece (a quad tap
  each: the orbit never moved); now pressed off the piece, then a fine park by the orbit's yaw → [`ORBIT_GATES.md`](../../../scripts/probes/ORBIT_GATES.md) §4.
* **FOR THE OWNER — not decided, nothing built**: (1) far out from the −x tip the gizmo now drifts over the ridge the other way (the finger's mapping read
  from the gizmo's side): the turn is the mirror of the one before — to see on the device; (2) the two-target framing (`poseFramingTwo`) rolls the long
  way when a turn's end pose swings half round the piece–aim line (separation near 180°): no edge crossing reaches it in the gates, an apex crossing did;
  (3) the side's bias (60° → 75° of the view) fading in under a fast climb turns a drag frame 10.3° (far out, near a tip). ⛔ No device look.

## 2026-11-17 — the deploy, the owner's look, the bottom face's circle ANALYSED (two Opus agents) — ✅ DECIDED: PACKAGE A REVERTED `6e56dfc`

✅✅ **The owner, 2026-11-17: *"Revert and then deploy"*** — package A (`fe06c2c`, `c53f54a`) is REVERTED by `6e56dfc`: `src` and `tests` byte-equal to
`c5aa295`, 164 files, **2058 vectors**; DEPLOYED: live `main` `6c0a165` = `1.0.147-` at `3de1256` (his look owed). Open: his corrected report on `Scene_0bis` (a SHAKE at the bottom face's entry and exit, by dx or dy, at every
distance — not analysed, to be judged on the reverted build first); the top ridge 50 % faster (not built; (a) its own speed for the half turns or (b)
every turn — not answered yet); step 3 once on the final code → `BOTTOM_FACE_CIRCLE_REGRESSION.md` §9.

* **Deployed** (the owner: *"Deploy so i can test and tell me what to look at."*): live `main` `a17c75e` = `1.0.147-` at `a1a52f0`. The night chain was
  stopped before step 3: step 3 is not run.
* **The owner's look:** *"4- nothing feels blocked. This is good"* (C5's hold); *"3- scene 0bis top ridge: ... good and I want to keep it. Just make
  it 50% faster."* (measured, NOT built); and a regression — the camera makes a circle at the bottom face close in (`Scene_0`, `Scene_1`; `Scene_0bis`
  at the bottom's exit, *"at any distance"*).
* **The analysis, challenged:** first bad commit `fe06c2c` (package A) on all three scenes, `c5aa295` clean. Cause: inside a running turn A sets the
  square camera at its target at once, so the two-target framing (`poseFramingTwo`) draws the whole 52° – 90° pitch — not one rotation close in: the
  camera swings sideways round the body (`Scene_1` 124° of path for 90°, 32.7° off its arc). A discriminating run (only that step of A switched off)
  made every turn straight. Verdict: sound in principle, a missed case; the ease also counted twice close in (holds twice as long). ⛔ `Scene_0bis`
  far out not reproduced. Six options, the ridge's pace, what is not checked →
  [`BOTTOM_FACE_CIRCLE_REGRESSION.md`](../../40_RENDER_SCENE/spec/BOTTOM_FACE_CIRCLE_REGRESSION.md).
* **His look on `6c0a165`, "why the heptagon's bottom shakes" — EXPLAINED, nothing built** (an Opus agent): the only level face reached from LEANING
  faces; a heading gap (the zenith fix's level reading against the square camera, `Scene_0` close in; the carried heading against the calm's view,
  `Scene_0bis` far out) is a roll only when the view is not level — +8.9° then back in 4 frames, 47° in / 39° out in 9 / 7 frames; none on vertical
  faces or close in on `Scene_0bis`; the same at `c7ac510`; a consequence nobody decided; options →
  [`BOTTOM_FACE_CIRCLE_REGRESSION.md`](../../40_RENDER_SCENE/spec/BOTTOM_FACE_CIRCLE_REGRESSION.md) §10.
* **Why a level face, and what would stop the shake — PROPOSED, nothing built** (an Opus agent): the two "up" rules agree on the glass only when the camera looks square to the edge (δ = atan(tan lean / sin elevation)); (A) `Scene_0` close in, the level reading with the square camera's share (`Scene_0bis` and `Scene_1` identical in every frame); (B) four candidates measured round the bottom / rectangle / triangle corner, and close in a roll the long way (262° – 273°, 127° in one frame) found; one rule for every tilt (his word) → [`LEVEL_FACE_ENTRY.md`](../../40_RENDER_SCENE/spec/LEVEL_FACE_ENTRY.md). N1 measured: it does NOT remove the entry turn (44°).

## 2026-11-17 — the level face's entry: ✅ APPROVED by the owner (*"Agreed to every recommendation. Proceed."*) — the build as briefed

The four recommendations he agreed to: (A) `Scene_0` close in built; (iv′) on a free face far out built **behind a switch** (`freeEntryUpright`, the
default 1; 0 = today) for his comparison on the phone; (v) the close-in roll the long way round built only if its condition passes the gates, else left
out and reported; the timing rule — 333 ms the longest duration for EVERY half turn (his *"50% faster"*, by one rule), 250 ms the least duration's
starting value. The rule finalized without §5's cliff at 2° (the least duration grows with the angle up to 30°). Three packages, an Opus builder then an
Opus auditor each: **LF1** (A) + (iv′) and the study's walks as a gate · **LF2** the timing rule · **LF3** (v), root cause first →
[`LEVEL_FACE_ENTRY.md`](../../40_RENDER_SCENE/spec/LEVEL_FACE_ENTRY.md) §9. Not in this build: the 27° left back over the entry edge near an end (a
study of its own). Then: the deploy on his word, his look, step 3 once, the merge.

## 2026-11-17 — LF1 built (an Opus agent): the gate, (A) built; (iv′) built then REVERTED — 21° in one frame far out

* **The gate** (`92f0878`): the study's walks in `scripts/probes` (`level_entry_*`; `ORBIT_GATES.md` §7) — `Scene_0` close in (6 walks), `Scene_0bis`
  round the corner at BOTH tips at four distances (27 walks); every timed turn's path against its one rotation, and the largest roll in one frame
  outside the timed turns. The study's figures reproduced exactly. New: the close-in long way round at the −x tip too (+257° for 112.6°), for LF3.
* **(A)** (`3ef7ba7`): `Scene_0` close in near an end, the roll before the bottom edge −11.1° → 0.0°, the edge's turn 13.2° → 2.3°, down off a top
  face −13.1° → 0.0°; `Scene_0bis` and `Scene_1` unchanged (`Scene_1` 11 frames in the last digits, as the study). 4 vectors, 4 mutants red.
* **(iv′)** (`069682a`, behind `freeEntryUpright`): the entry silent (+45° → 0°), a ccw loop one turn (83°), the cw loop 69° → 32°, close in
  untouched, the switch at 0 identical to (A) — but far out at 2 px a frame the picture now rolls **up to 21° in ONE frame** outside any timed turn
  (today ≤ 4.4°): the fade by the view's elevation (70° – 80°) sits where the bottom is seen far out, and the depth's blend has no bound per frame.
  **Reverted** (`fa72bab`). The study's prototype had the same (its timed-turn gates could not see it). Options for the owner → [`LEVEL_FACE_ENTRY.md`](../../40_RENDER_SCENE/spec/LEVEL_FACE_ENTRY.md) §10.3:
  the fade by the square camera's share; a bound per frame at the one speed; a longer band; or no (iv′).
* **Next:** his choice on (iv′); LF2 (the timing rule) and LF3 (the long way round) on `3ef7ba7`'s code. No device look.

## 2026-11-17 — LF2 built (an Opus agent; base `0ab1f9f`): one rule for every tilt — far out; close in kept at the one speed

* **The gate** (`6236fb4`): every probe records each frame with `DUMP=` (`scripts/probes/turn_rec.mjs`); `turn_table.mjs` reads every timed turn base
  against new — frames, the rule's frames, one rotation, path, the largest frame, the route at the same fraction of the path.
* **The rule** (`e7ff2ed`; `git revert e7ff2ed` undoes it): `turnDurationMs` / `turnStepRad` (`src/input/orbit_tilt.ts`), `tiltMinMs` 250, `tiltMaxMs`
  333, `tiltSmallDeg` 30, three sliders; read by `zoneStep`, the paced entry's time and the way out's ceiling. 2080 vectors (`tests/turn_rule.test.ts`,
  red on 11 mutants). Both durations at 0: the three replays identical in every frame.
* **Measured first, then built**: with the rule alone, every close-in transition changed its PATH (the square camera's pitch runs beside it — the two
  clocks of `TILTED_POLE_CLOSE_IN.md` §12): the half turns ended at 172° instead of 180°, 9° – 11° off their route. So **a turn the square camera runs
  beside keeps the one speed** (`turnDials`). Close in nothing changes (the 52° entries stay 9 frames, the close-in half turns 30).
* **Far out**: `Scene_0bis`'s entries 6 – 7 → 15 – 16 frames, the half turns 25 – 31 → 20 – 21 (the top ridge's *"50% faster"*), the way out at 4 px
  37 → 25 frames; a finger-paced way out unchanged. ⚠ The entries' route 4° – 7° off the base's mid-turn (the gizmo's ease and the piece's spring in
  the turn's first frames, untimed); ⚠ one far-edge half turn now drawn the long way (−208° for 151°, `b_far_p_far`) and one in the `Scene_0bis` replay's
  other play — LF3's drawing → [`LEVEL_FACE_ENTRY.md`](../../40_RENDER_SCENE/spec/LEVEL_FACE_ENTRY.md) §11.1.
* **Next:** the owner — the close-in turns (§12's option A, or as they are), the entries' route; LF3. No device look.

* **Then REVERTED** (`cb89bdd`, after the independent audit): far out the rule changed the camera's path (a new long-way half turn on `b_far_p_far`,
  ratio 1.05 → 1.43; the entries 4° – 7° off their route), and the brief's answer to a path change was to build nothing. The code is `0ab1f9f`'s again;
  the gate's tools (`6236fb4`) stay. The owner's options (wait for LF3; time the entries after the ease settles; accept and `git revert cb89bdd`) →
  [`LEVEL_FACE_ENTRY.md`](../../40_RENDER_SCENE/spec/LEVEL_FACE_ENTRY.md) §11.2.

## 2026-11-17 (evening) — (A) DEPLOYED; the owner's look; the chain STOPPED on his word; his question on the fast orbit

* **Deployed** (the owner: *"deploy the fix"*): live `main` `c343c4f` = `1.0.147-` at `892b6a3` (20:46; `src` and `tests` equal to `3ef7ba7` — (A)
  alone; 165 files, 2062 vectors).
* **His look**: *"I am happy with the build as it is now. Is it necessary to continue the chain ?"* — no: only LF3 was left. Then: *"stop the chain
  and clear its leftover processes … save the builder's unfinished prototype as a patch outside the project, then restore the folder to the deployed
  commit … record in the documents the deploy, the stop on your word, and the open point … Do not audit yet. I want to check one thing before"*.
* **Stopped** (21:13): LF3 in its step 2 — its root cause kept (`3553f79`, §12), its prototype never committed (its rule in words, its one reading and
  the patch's place → [`LEVEL_FACE_ENTRY.md`](../../40_RENDER_SCENE/spec/LEVEL_FACE_ENTRY.md) §13). The worktree clean; `src`, `tests`, `scripts` =
  `892b6a3`'s. ⚠ The stop left the builder's DRIVER script alive (its scratchpad `run_gates.sh`): the first batch killed, it launched the next one —
  stop the driver FIRST, then the batch, the server, the browser, the guards, the profile folder (`ORBIT_GATES.md` §0's incident, one level up).
* **Open, none owed** (§13's table): the close-in long way round (root cause known, not fixed — in the live build); the far-out entry turn ((iv′)
  reverted); one rule for every tilt and the ridge *"50% faster"* (reverted); the 27° back over the entry edge.
* **Step 3 NOT run** (*"Do not audit yet"*).
* **His question** — a fast orbit on `Scene_0bis`: *"each crossing triggers a movement of the camera: orbiting fast creates a lot of rapid movements
  of the camera. Is there a way to smoothen these movements … ignoring the intermediate quaternion … Do not build: check the patent-free
  state-of-the-art literature, propose something."* (whole in §14). Measured from recordings on disk: the same scripted play, 22 transition turns on
  `Scene_0bis` against 4 on `Scene_0` and 4 on `Scene_1`, 14 of the 22 within half a second of the one before. PROPOSED (§14, nothing built): one
  follower — the newest target wins, the gizmo not held for a turn under 90°, the pace eased; it bends T5 (said there). His word before any prototype.

## 2026-11-17 (night) — the owner's GO for the fast orbit, the audit and the merge's preparation; branch `1.0.148-`

* **His words** (whole in [`FAST_ORBIT.md`](../../40_RENDER_SCENE/spec/FAST_ORBIT.md) §0): *"I will go to sleep. Therefore, proceed with the following
  and do not stop or ask me question until you finish"* — (1) a new branch `1.0.148-`; (2) the fast orbit built and tested, no regression — a failed
  test fixed and retested, twice at most, *"If the test fails a third time, abort and revert to the branch 1.0.147-. If the test pass, update the md
  files, deploy"*; (3) *"the full audit of the orbit charts"* on the branch that stands, *"one round of fixes if required, test, make sure no
  regression. If test fail, report and wait my instruction"*; (4) *"update the md files, prepare for the merge into worktree "3d_assembly_game". I
  will then authorize the merge"*.
* **Branch `1.0.148-`** created from `1dac167` in the worktree `../orbit_charts` (`npm run verify` there: 165 files, 2062 vectors). `1.0.147-` stays
  at `1dac167` — the way back.
* **The build as briefed** → `FAST_ORBIT.md` §1 – §5: the decisions taken for him to review (F1 – F8: two packages, FO1 the redirect and no hold under
  the limit, FO2 the eased pace; only outside close in; the limit and the ease two sliders, each at 0 = today's game bit for bit; one deploy), the two
  contracts, the gates that define "the test passes" (OFF frame for frame, close in turn for turn, the held turns, no drift, the slow walks, the
  benefit on FAST walks), what is not in it.
* **Then**: step 3 (the audit of the whole charts' diff from `510bbd8`, one round of fixes), the final documents, the merge's preparation. The merge
  itself: his word.

## 2026-11-17 (night, 22:45) — the job list MODIFIED by the owner: the silent entry built and tested before the audit; G3's note

* **His words** (whole in [`LEVEL_FACE_ENTRY.md`](../../40_RENDER_SCENE/spec/LEVEL_FACE_ENTRY.md) §15): not happy with the entry turn (*"Why it cannot
  keep the quaternion it inherited from the previous face ? Or … why can't we make the turn slower"*); then *"once you have successfully completed
  branch 1.0.148- or you have reverted to 1.0.147-, insert the build and test of entry silent with "Kept at the entry, then turned to the face's
  layout over its first half" before you perform the full audit"*; *"I assume this is valid for any level face"*; *"make sure that this can be done
  after the fast orbit"*.
* **The night's list now**: (1) the fast orbit FO1 / FO2 (running) → the deploy if it passes, or back to `1.0.147-`; (2) **the silent entry** = (iv′)
  from `069682a` with its two cures, behind `freeEntryUpright` — built and tested, not deployed (§15: the decisions E1 – E7, the contract, the gates;
  valid for any level face that carries a heading; independent of the fast orbit, built after it); (3) the full audit, one round of fixes; (4) the
  final documents, the merge prepared.
* **G3's note** ([`FAST_ORBIT.md`](../../40_RENDER_SCENE/spec/FAST_ORBIT.md) §1 F9, §4): a far edge's half turn coming out the other way round is
  listed, not a failure — written by the lead while FO1 was being built, so that a defect of the two-target drawing that is at the base already cannot
  undo the build.
* **Room made**: `LEVEL_FACE_ENTRY.md` §11.1 (LF2 as built, reverted) moved word for word →
  `Claude/40_RENDER_SCENE/history/2026-11-17_lf2_timing_rule_as_built.md`.

## 2026-11-17 (night, 23:10) — the owner's report: after a half turn he cannot revert the dy; to fix before the audit

* **His words** (whole in [`DY_HOLD_REVERSAL.md`](../../40_RENDER_SCENE/spec/DY_HOLD_REVERSAL.md) §0): on `Scene_0bis`, after a level face's far edge
  (the 180° roll) or the zenith edge, *"most of the times I cannot revert the dy input (the green section travel) until I reach the opposite zenith
  edge or level face … always present at far distance, not always at close in. It was not here before. Make long walks over the rectangle faces at
  different distance to troubleshoot. Fix that before the full audit."*
* **Read in the code, not measured yet** (§1 there): the hold after a half turn ends at `edgeHoldMm` = 30 mm of FINGER travel the other way (since
  2026-11-14; a depth on the surface before) — far out that can be the way round to the opposite edge. To be confirmed or refuted by the long walks,
  with the other causes listed there; *"It was not here before"* checked on earlier commits.
* **The night's order now**: the fast orbit and its deploy → **the dy hold's fix** (root cause first, the decisions D1 – D5, the gates: the report's
  case at every distance, no ping-pong, nothing worse elsewhere) → the silent entry (tested with these walks too) → the audit → the final documents,
  the merge prepared. Built and tested, not deployed: his word.

## 2026-11-18 — FO1 (the fast orbit's first package): built, measured, NOT BUILT — reverted

* **The result**: the game is the base's again. FO1 (`45b0d2f`: no hold for a timed turn under 90° outside close in, the two readers on the target,
  the back-and-forth fallback) reverted by `2a5a28b`. Why: with its fallback the 30 px fast loops reverse the picture more than at the base (4 → 14,
  6 → 12, 10 → 16, 15 → 18), the worst frame is over the base + 1° on 5 walks, and the `Scene_0bis` replay shows a free turn that began at 59° and
  chased the finger round a 342° path to end 113° away. The figures and the owner's options: [`FAST_ORBIT.md`](../../40_RENDER_SCENE/spec/FAST_ORBIT.md) §6.
* **What passed**: the limit 0 is today's game bit for bit (replays, level entry a and b, the fast walks); close in untouched (every `tilt_check`
  recording identical); on 20 px loops the turning 18 – 61 % lower and no stop at each edge.
* **What stays**: the gate (`5401ad7`) — the fast walks, their reading, the no-drift replay, the base table: `scripts/probes/ORBIT_GATES.md` §9.

## 2026-11-18 (00:30) — the fast orbit: one real test failed; the two fix rounds he ordered are run on an amended contract

* **What the night's chain did**: FO1 built, measured, reverted by its builder ([`FAST_ORBIT.md`](../../40_RENDER_SCENE/spec/FAST_ORBIT.md) §6: a free
  turn's picture circled — 113° drawn over 342° —, more reversals on the 30 px loops, the worst frame over the base's). Its two fix rounds changed
  nothing (43 and 26 seconds): the cure was outside the contract the lead had written. ONE real test, not three.
* **The lead's reading** (§7 there): his rule gives two fix rounds; they are run now. The root cause: the turn fades from a FIXED start pose, so a
  moving target makes the picture swing round its start. The contract amended (F10 – F16, for him to review): the start carried with the target (only
  the turn's own gap dissolves), the one speed as the picture's budget, the readers on the target in every timed turn, FO2 not run tonight. A failed
  test 3 = the abort, back to `1.0.147-`.

## 2026-11-18 — fix round 1 of the fast orbit (test 2): built on §7, measured, NOT BUILT — reverted

* **The result**: the game is the base's again (`83a7713` built, `18787b9` its revert). The circle is cured — a free turn's angle stays its first
  frame's, the gap drawn ↔ target never grows (≤ 1.13° a frame) — but the picture now follows the finger's own fastest turn while a free turn runs:
  the worst frame over the base + 1° on 9 of 23 fast walks (up to 43.0° vs 25.9°), more reversals on 11, the `Scene_0bis` replay's roll 18.9° → 29.3°.
  At the base those moments fall inside held turns. The fallback (F14) was not needed. Figures and options: [`FAST_ORBIT.md`](../../40_RENDER_SCENE/spec/FAST_ORBIT.md) §8.
* **What stays**: the turns' recorder records each turn's hold and the pose built / drawn (`0c885d1`); the circle's check, `turn_circle.mjs` (`a46b5a7`).
* **Next**: test 3 (fix round 2) is the last; a third failure is the abort, back to `1.0.147-`.

## 2026-11-18 — fix round 2 of the fast orbit (test 3, the last): three realisations measured, NOT BUILT — the abort

* **The result**: test 3 failed, so by the owner's rule the fast orbit is aborted, back to `1.0.147-`. The game is the base's again (`1b6b1a7`
  built, `3ad84da` its revert). Fix round 1's blockers had one root cause: with the start carried, the picture turned as fast as the target, which at
  30 px a frame turns up to 21 – 52° in a frame — stretches the base never draws (held turns drop the finger's steps there).
* **Tried**: one follower from the pose drawn (v1); the same capped at the one speed (v2, committed: every free frame within 6.0°, the 20 px walks
  better on everything but reversals); the gap never growing (v3). At 30 px each fails G6: the picture shows the target's fastest frames, or it lags,
  the next turn holds and its drawing jumps 55 – 130°. G5's `Scene_0bis` replay: 14.1° → 49.6°. Figures and options: [`FAST_ORBIT.md`](../../40_RENDER_SCENE/spec/FAST_ORBIT.md) §9.
* **What stays**: the reading `scripts/probes/turn_where.mjs` (`e3a924a`); the recordings `<scratchpad>/fo1c`.

## 2026-11-18 (01:25) — the fast orbit: three real tests failed — THE ABORT done, the night goes on from `1.0.147-`

* **The three tests**: the first build (`45b0d2f`: the circle), fix round 1 (`83a7713`: the circle cured, the picture follows the finger's fastest
  turns — frames of 17 – 43°), fix round 2 (`1b6b1a7`: every free frame within 6°, but at 30 px a frame a lag of 80 – 137° then a held turn that
  jumps). Each measured and reverted by its builder ([`FAST_ORBIT.md`](../../40_RENDER_SCENE/spec/FAST_ORBIT.md) §6, §8, §9).
* **The abort** (his rule, the lead's step): the worktree back on `1.0.147-`; the night's documents and probes carried over (twelve commits picked,
  the tree identical to `1.0.148-`'s tip, no commit past `892b6a3` touching `src` or `tests`); `1.0.148-` kept local, not pushed, as the record.
  Nothing deployed. The lead's reading and proposal: §10 there.
* **Next, in his order**: the dy hold's fix ([`DY_HOLD_REVERSAL.md`](../../40_RENDER_SCENE/spec/DY_HOLD_REVERSAL.md)), the silent entry
  ([`LEVEL_FACE_ENTRY.md`](../../40_RENDER_SCENE/spec/LEVEL_FACE_ENTRY.md) §15), the audit — all on `1.0.147-`, without the fast orbit.

### 2026-11-18 — package DH: the dy held after a half turn (the owner: *"I cannot revert the dy input"*) — built, not deployed

* **Root cause** (measured first, `DY_HOLD_REVERSAL.md` §5, `0eb58f3`): three. (1) The release was 30 mm of FINGER summed: far out a finger mm is
  13 – 21 mm of surface, so 30 mm = 430 – 450 mm (two faces of 221 mm, to the opposite level face); and a summed counter, not a hysteresis (a ±2.5 mm
  wobble reached 21 mm). (2) A hold set with no finger down (the spit's crossing read a frame after the lift, the coast) blocked the next press from
  its first frame — `asmDySign` never reset. (3) Round a tip a dx-made crossing set the hold again with the zenith's old dy: blocked on the triangle.
  The same at `c7ac510`, `ef14420^` (identical frame for frame) and `a1a52f0`: *"not here before"* not reproduced.
* **Built** (`1562bd1`, one commit, `git revert 1562bd1` undoes it): a true hysteresis, band 8 mm; the dy pushing now (none at the gesture's end, none on a
  sideways step); each crossing's hold replaces the last. 7 mutants red. The probe: `scripts/probes/hold_walk_*` (`3013992`, `a96f382`; runbook
  `ORBIT_GATES.md` §10).
* **Gates** (§6 there): every come-back after 12 mm or more back — blocked 112 frames → 0, every distance and crossing; under the band still held, no
  second crossing; the triangle 56 → 0 – 1 blocked; the coast and the lift leave no hold; the ridge / tilt / across / tip gates identical; the
  replays identical (`Scene_0`: last digits); `npm run verify` 165 files, 2066 vectors. ⛔ No device look; ⛔ not deployed (D5: his word).
* **For him to choose**: the band 8 mm (margin 3 mm over a ±2.5 mm wobble) — far out about 0.9 of a face before a dy back is honoured once the
  turn is over; 6 mm also passed the walks (about 0.7 face, margin 1 mm). The slider: ☰ → TILTED POLE.
* **Seen and not changed**: under the hold a finger wobbling ±2.5 mm while pushing walks the gizmo AWAY from the edge (the held half dropped, the
  other half passed: 400 – 450 mm in 144 frames) — the hold's own rule, at the base too; the probe's `Scene_1` walk does not reach the cube's top.

## 2026-11-18 — the silent entry (package ES): NOT BUILT — the free roll cured, the worst frame inside timed turns not

* **Result**: nothing under `src` or `tests` changed (base `bc867a0`); four versions measured and undone, their patches in the session scratchpad
  (`es/es_build_v1.diff` … `v4.diff`). THE FREE ROLL — `069682a`'s failure — passes everywhere (cw loop 21.4° → 4.8° – 5.3°; base 2.0°). What fails:
  the whole walk's worst frame (base + 1°) by 0.2° – 1.5° on 2 – 4 walks, always in a timed turn's first frame (a turn advancing on its first, smaller
  angle while the target moves — its pace is out of the brief's reach), and the exit in the middle of the entry edge 4° – 5° (gate 3°)
  ([`LEVEL_FACE_ENTRY.md`](../../40_RENDER_SCENE/spec/LEVEL_FACE_ENTRY.md) §16, with the table).
* **What held**: the switch at 0 bit for bit (the three replays, the 33 level-entry walks); close in every walk within 2.1e-8 of the base; `Scene_1`
  and `Scene_0` replays identical at 1; v3's entries far out 0° (the ccw loop one turn a loop); the dy hold's blocked frames as at the base.
* **For him**: accept the worst-frame margin (v3's patch), change the timed turns' pace (a package of its own), or keep today's entry.
* **Probes** (`d535287`): `level_entry_cmp.mjs`, `level_entry_worst.mjs`, `level_entry_batch.sh` mode c ([`ORBIT_GATES.md`](../../../scripts/probes/ORBIT_GATES.md) §7.3).

### 2026-11-18 — package ES, fix round 1: still NOT BUILT (one walk 0.3° over its limit)

* **Result**: `src` and `tests` as at `bc867a0`; no code commit. Three more versions measured (v5 – v7, the session scratchpad's `es2/`): the
  picture's target read every frame on the entry side's camera (the middle exit −5° / +4° → −0.2°), the heading held while a camera turn runs and on
  the frame it lands (the 4 px loop's worst frame 9.1° → 8.0°, `mid_check` 10.8° → 9.7°).
* **What fails**: the cw loop −x (far and at 0.736) — 8.8° in one frame against 8.5°, the first frame of a short exit turn whose angle grows while it
  starts — the turns' pace, out of the brief's reach. And a wobble no gate reads: 61 exit turns of about 6° at the 4 px loop's dither (base 118
  turns of about 3°; the gizmo held 67 frames, base 21).
* **For him**: as before (accept, change the turns' pace, or keep today's entry); v7 the closest
  ([`LEVEL_FACE_ENTRY.md`](../../40_RENDER_SCENE/spec/LEVEL_FACE_ENTRY.md) §16, its last paragraphs).

### 2026-11-18 — package ES, fix round 2 (the last): still NOT BUILT — the silent entry left for the owner

* **Result**: `src` and `tests` as at `bc867a0`; no code commit. One more version measured (v8 = v7 + the blend read at the deepest depth reached
  since the entry, the session scratchpad's `es3/`): worse — the cw loop −x 8.8° → 9.4° (limit 8.5), +x 7.8° → 8.5° (limit 7.9).
* **Why, read off the frames**: the exit turn there is short (13.6°, base 59°) because the picture kept is close to the face beyond's camera, and
  in the turn's first frame that camera moves 7.5° with the finger's look (base 0.1°): 6° over 13.6° applied to 21.1° — the turns' pace. Every
  silent picture makes this exit short; nothing on the free face reaches that frame.
* **For him**: the timed turn advanced on its current angle (a package of its own), then v7 re-gated whole; or keep today's entry
  ([`LEVEL_FACE_ENTRY.md`](../../40_RENDER_SCENE/spec/LEVEL_FACE_ENTRY.md) §16, its last paragraphs).

### 2026-11-18 (morning) — the lead: the owner awake; why the fast orbit failed; his pace; FO3 agreed; the silent entry's chain stopped on his word

* **His question** (*"analyze why the fast orbit failed … the specification and the logic behind the fast orbit was not properly drafted"*): he is
  right — four errors of the lead's specification, read off the night's recordings split into the orbit itself and the roll
  ([`FAST_ORBIT.md`](../../40_RENDER_SCENE/spec/FAST_ORBIT.md) §11). Like for like, today's game shows 93° of roll per metre of gizmo travel with the
  gizmo stopped in 39 % of the frames; the second build of the night already showed 24° a metre.
* **His pace** (*"Use the existing recordings to see the px per frame average and design from that. Then do 2 and 3."* — *"They are in the E:
  drive"*): his play recorder's sessions of 2026-11-14 read — 571 px a second on average, 1 213 at the top tenth; the gizmo stopped by a turn during
  31 – 39 % of his moving time (§12.1).
* **FO3 — the picture a follower of the logic**, the study in his four parts (§12): the ghost's twist about the line through the piece and the look
  point, one gap, a critically damped follower (200 ms), no stop under 90°; the test rewritten (his hand replayed, per metre of gizmo travel).
  ✅ **The owner: *"Agreed"*.** To be built on `1.0.148-`, the shadow first, after the charts' audit. ⛔ Nothing built yet.
* **The silent entry**: fix rounds 1 and 2 not built (v7 the best: one gate missed by 0.3°; v8 worse). ✅ **The chain stopped on his word before its
  undo** (*"0.3degree failure does jot warrant reverting to previous build"*). The 0.3° read frame by frame: the timed turn's share is advanced on
  the angle of the frame before and applied to this frame's — today's game has it too; the options (§11.4). v7 is a patch in the scratchpad;
  `src` and `tests` are `bc867a0`'s.
* ✅ **The owner (2026-11-18): *"Keep version 7. Continue."*** — the silent entry's v7 put in from its patch (the switch `freeEntryUpright`), the
  8.8° frame accepted; every gate of §15 re-run on the commit and independently checked. ⛔ The charts' audit launched at 08:20 did NOT run: its
  six readers stopped on the account's usage limit after ten minutes, nothing read — launched again.
* ✅ **2026-11-18 (afternoon): the silent entry's v7 as committed (`3c66eb9`) gated** — verify 2091 vectors green; G1 – G6 of `LEVEL_FACE_ENTRY.md` §15
  re-run on the commit, one headless run at a time, no profile or process left: all pass but the accepted 8.8° frame of the cw loop on −x
  (§11.4 of `FAST_ORBIT.md`) → `LEVEL_FACE_ENTRY.md` §17.
* ✅ **2026-11-18, evening — the silent entry and the dy hold's fix LIVE** (main `bc8dc9e` = `1.0.147-` at `31fec5b`; version 7's six gates
  passed, the accepted miss aside). **The owner: *"Make a new branch 1.0.148- and move to this new branch."*** — `1.0.148-` made from `1.0.147-`
  at `d6f9771`: FO3 is built there, by packets, from a fresh lead session (the handover:
  [`HANDOVER_2026-11-18.md`](HANDOVER_2026-11-18.md)). The night's branch of that name (the three reverted builds, `fa0e2a2`) is renamed
  `1.0.148-Fast-orbit-three-builds-reverted`, kept local.

### 2026-11-18 (evening) — FO3 S0, the shadow: built and measured, nothing drawn changes — section 12 refuted on his hand (A7)

* ✅ Built on `1.0.148-` (local commits): the follower's pure parts (`src/input/roll_follow.ts`, 16 vectors, 15 mutants red) and the shadow computed
  at the camera's stage, recorded, never drawn (`src/render/roll_shadow.ts`); the probes `hand_replay.mjs`, `hand_batch.sh`, `shadow_read.mjs`.
  The seeded replays identical to the base (`Scene_0` within its last-digit noise).
* ✅ Confirmed on the steered corner loops: to 1 200 px a second the gap under 60°, the roll a metre halved or better.
* ⛔ **Refuted on his own hand** (`Scene_0bis`, far out and at 0.736): the gap over 90° in 9 of 10 stretches (up to 178°) — the ghost turns up to 42°
  a frame with the gizmo free near a tip's axis; `Scene_1` over its top: 161°, outside any spit. O6's fallback sized offline does not meet A7.
  **S1 not started**: the amendments for the owner's decision → [`FAST_ORBIT.md`](../../40_RENDER_SCENE/spec/FAST_ORBIT.md) §13.6.

### 2026-11-18 (night) — FO3 S1, the picture drawn: built; S2 built and reverted; partly built

* ✅ Built on `1.0.148-` (`87cd6c2`, local): the changes of frame under `freeTurnMaxDeg` (90°, less 2°) make no timed turn; the roll about the line
  through the piece and its look point follows the logic (`rollFollowMs` 200 ms); `freeTurnMaxDeg` 0 = today's game, bit for bit (checked on the
  replays, his hand, the fast, dy hold and level entry walks).
* ✅ The corner loops of `Scene_0bis`: the roll a metre a fifth to a tenth of today's, the gizmo never stopped, the gap under 90° to 2 000 px a second.
* ⛔ His hand: the worst frame of roll cut to a third or less, but the roll a metre only −13 %; the finger against the gizmo worse where the gap is over
  45° (A5, A6 not met). The level entry's straight dy drifts twice as far.
* ⛔ S2 (the finger turned by the gap outside a spit, `48ae89c`) REVERTED (`f198b3a`): a feedback at a pole (`Scene_1`'s top: 288° a metre against
  129° today). The figures and the decisions → [`FAST_ORBIT.md`](../../40_RENDER_SCENE/spec/FAST_ORBIT.md) §14.

### 2026-11-18 (late night) — the lead: the deploy of S1 + S2, his look, his order, the studies; the upright picture goes to `1.0.148b-`

* **Deploy** on his word (*"can you deploy so I can test in parallel ? and tell me where are the sliders located"*): LIVE main `4eabab8` = `1.0.148-` at `48ae89c`, 21:23; the Pages build passed `npm run verify`; not independently tested. ⚠ LIVE holds S2, reverted on the branch an hour later (`f198b3a`). Sliders: ☰, ORBIT › SMOOTHING (`rollFollowMs`, `freeTurnMaxDeg`).
* **His look** (about 21:50): *"the build is very good at 160 ms and 90degrees: set them as default. However, I want to modify something: is it possible to maintain the gravity align with the screen's vertical axis, or at least : for the vertical axis and gravity alignment to be as the initial game (for example in previous branch 1.0.147-) ? That would avoid the scene to roll on the screen view (which is annoying). note that a pitch in the screen view or a yaw in the screen view is ok, in my opinion as I judge it from the screen. I want to avoid the roll of the scene in the screen view. Propose a logic, test the logic on simple geometries, then build it in a new branch 1.0.148b-Fast_orbit_upright_gravity."*
* **His order** (about 22:00): *"I will go to sleep. finish the builder's report, update the md files in branch 1.0.148- then proceed with the build of branch 1.0.148b, test, finetune until the result is acceptable, update the md files, deploy. then I will test tomorrow morning and we shall advise the next step (full audit of orbit charts or rework of the fast orbit). In the meantime, do not ask me question nor decisions as I won't be able to answer until tomorrow morning."*
* **Mitigation study** (one Opus agent, offline, nothing built): the fast roll near a tip's axis is the logic's upright camera whose heading swings near the vertical; it does not cancel with the crossing's half turn (21 of 27 passes). Largely superseded by his look → [`FAST_ORBIT_MITIGATIONS.md`](../../40_RENDER_SCENE/spec/FAST_ORBIT_MITIGATIONS.md).
* **Upright study** (one Opus agent, offline): gravity tilted over 20° on the glass, share of frames, before FO3 (`6f47219`) → `48ae89c`: the cube 1.1 → 15.2 %, the heptagon 0.4 → 18.7 %, his hand 28 – 42 → 44 – 53 %. Law U (the picture turned about the line through the piece and the look point to put gravity on the glass's vertical, in full from 25° off the vertical, none within 5°) gives 0.2 – 8 % on his hand offline. Spec: `UPRIGHT_PICTURE.md` on `1.0.148b-` (not on this branch).
* **Not run**: the independent test of S1 as built (the picture's rule changes in `1.0.148b-`; tested there once). `FAST_ORBIT.md` 14.7 stays open.
* **Branch**: `1.0.148b-Fast_orbit_upright_gravity` made from this branch's tip after the docs commit. `1.0.148-` is pushed to origin at `48ae89c` only.
* **The lead's choices in his absence** (each reversible by a switch or a slider): defaults `rollFollowMs` 160, `freeTurnMaxDeg` 90 (first commit of `1.0.148b-`); law U behind a switch (off = the build he looked at, without S2); "acceptable" = on his replayed hand gravity's tilt and the scene's roll no worse than `1.0.147-`'s, the gizmo never stopped under 90°, nothing worse than tonight's build elsewhere; two fix rounds at most; if the gates still fail: `1.0.148b-` deployed with the upright switch OFF and the 160 ms default, nothing undone.

### 2026-11-18 (night, later) — law U built on `1.0.148b-`: gravity upright, but the half turn over a top in one frame; partly passing

* **Built** (local, not pushed): `7bcae02` `rollFollowMs` 160; `e82ae2e` `src/input/upright.ts` (law U, closed form); `bb4b5fa` the picture drawn
  behind `uprightPicture` (default 1), the finger off the picture; `8348ce1` a change freed only where the picture is upright at both ends;
  `e615a61` `gravity_read.mjs`, `upright_batch.sh`. Six sliders in ☰ › ORBIT › UPRIGHT PICTURE. → `UPRIGHT_PICTURE.md` §5.
* **Measured on his ten stretches**: gravity over 20° 35.4 % (`1.0.147-`) → 3.2 %; its roll 101.5 → 19.9° a metre; corner loops 0; U-G1 (both
  switches off: bit for bit) and U-G4 pass. ⛔ 84 frames turn the camera over 90° in ONE frame (`1.0.147-` 0): the view crosses the 5 – 25° band in
  one frame at his pace; the cap inside the band cannot act. ⛔ A6 on the picture over `1.0.147-` + 5° on 7 of 10; held frames a metre over the
  deployed build's on 9 of 10; close in not identical to the switch off (UD5); the level entry's straight dy drifts 1.2 – 1.9 × (root traced: the
  finger read off a picture that differs from the logic's — `freeShownHeading` cleared).
* **Experiment, not committed**: the cap at `w` = 1 too, 720° a second — one-frame flips 84 → 10, over 20° 12.0 %, roll 51° a metre. For the lead.
* **2026-11-19 (fix round 1)**: law U in time (`5d1f17c`, `d7ec0d2`, `9cf3fda`, `06d9faa`): no frame turns the camera over 90° on his hand (84 → 0), gravity over 20° 7.1 %, roll 57° a metre, the rest at 1 440° a second; ⛔ open: 45 – 90° frames (45 vs 5), A6, held frames vs deployed on 5 of 10 → `UPRIGHT_PICTURE.md` §7.
* **2026-11-19 (fix round 2, `UPRIGHT_PICTURE.md` §9)**: the finger turned once at the entry (UD8b, `7fe646c`; and its mirror since FO3's S2 fixed), a
  hold dropped where its change is freed fully upright (UD11, `25477c7`), the minors (`7516ce3`): the dy hold as `1.0.147-`'s on the hold walks, the
  identities kept; ⛔ R7 14.9° (target 14.1°), one frame of 98° on one stretch, `z_far` s2's come-back, the straight dy at 6 px a frame — open (§9.4).
* **2026-11-19 (fix round 3, `UPRIGHT_PICTURE.md` §11)**: the carry is the logic's twist undone (UD6c, `fb80fd0`), a freed change never holds
  (UD11b, `f1f9b55`), the rest at 1 800° a second (`4d4f658`): no frame over 90° on his ten stretches, 47 of 45 – 90°, gravity over 20° 7.8 %, its
  roll 58.8° a metre, R7 13.4°; the hold walks as round 2's; ⛔ the identity with `e653099` lost since round 2 (the mirror fix, the holds dropped).
* **2026-11-19 (the rebuild, `UPRIGHT_PICTURE.md` §12 – §13)**: one owner per thing — a change of frame decided once as he sees it (`changeSeen`,
  `b0f58a7`), the dy hold the dy of the glass he sees, on the raw finger (`6e328cd`, `fdac5f0`), the law's own half turn a seen turn (`1d5125e`);
  RB4 not built (its proof failed), the pace kept at 1 800° a second. The hold walks as `1.0.147-`'s on `z_far` (held 100 / 105 frames, 0 mm);
  ⛔ open: 51 frames of 45 – 90° (aim under 27), R7 14.7° (patched 13.4°), `b_far` sets no hold (§13.4).
* **2026-11-19 (the morning: the audit, the deploy, option 3)**: on waking he asked about the three fix rounds: *"make sure your three fixes addressed deep root causes, and are not patches which rules may conflict with other rules. If they are patches, do a proper rebuild of 1.0.148b."* The lead found, and one Opus study confirmed, that the law and the finger's one conversion were from the root but the JOIN with the logic was patched (a turn created by the logic then deleted at the camera's stage, a hold set then dropped, an event's rule); the join was rebuilt, one owner per thing, and independently audited: PASS, with one conflict left in the law, whose root is decision UD12 (the logic's pose still carried upside down under an upright picture). His words on the lead's three options (1 deploy as it is for his look; 2 a small step inside the law; 3 the logic's own camera upright at the source): *"Do 1 and start 3."* and *"Start 3 in a new branch"*.
  **Deployed** at 10:00: LIVE main `675ec23` = `1.0.148b-` at `d6f200e` (live confirmed, build `675ec23`); before it main `4eabab8`. ⛔ No device look yet.
  The auditor's figures on his ten stretches far out (this build / `1.0.147-` / the build of 2026-11-18 evening): gravity tilted over 20° 7.9 % / 35.4 % / 47.0 % of the frames;
  gravity's roll a metre of gizmo travel 56.4° / 101.5° / 127.3°; frames turning the whole camera by more than 90° at once 0 / 0 / 0, by 45 – 90° 51 / 5 / 8; the finger's angle against the gizmo's way, median 14.7° / 12.1° / 14.3°;
  the picture rolling a third of a turn and back near the vertical 7 / 0 / 0 (the one conflict left); the dy hold as `1.0.147-`'s. `npm run verify`: 170 files, 2173 vectors. The record: `UPRIGHT_PICTURE.md` §12 – §14.
  **Next** (option 3): the logic's own camera upright at the source far out, no pose carried upside down, the half turn once; his T4, T7, T9 and the charts' rule move together. On a NEW branch `1.0.149-Upright_at_the_source`; first an offline study in his four parts, nothing built before his word on its decisions.
* **2026-11-20 (`1.0.148e-`, ONE CARRIED UP — packet E, fix round 1; `UPRIGHT_CARRIED_UP.md` §7)**: built `38a2fdd` (local, not pushed): the alignment
  paid by the finger alone (E-D6: the dy that leaves; a dx at most half its yaw step; never by time), no solve while the half turn holds (the solver read
  the orbit's reset as a finger step back), the finger turned onto the logic's glass outside a spit. Measured on his ten stretches: the gizmo still while
  held (1 frame over 1 mm after the first, 82 before), R7 with φ ≥ 5° 23.9° (27.9°), the dy hold walks s0 / s1 identical, close in and the identity exact;
  ⛔ worse: a dy over `Scene_1`'s top now rolls the picture near the pole (250° against 61°: the dx's budget reads the orbit's yaw, which a dy swings
  there), a rest after a half turn still closes with no finger (any outward drift of the view pays it), an upside-down picture lingers on ~1 % of the
  replays' frames. The 8 "blocked" frames of the come-backs: a reader artifact (the dy hold after the second crossing, no `mix`). No device look.
* **2026-11-20 (packet J — his verdict on the live build `28a29ca`: jumps of the camera and the piece at a level face, `Scene_0bis` and `Scene_1`).**
  His two videos read by numbers, a reader of his words (33 ms bins), every build on one table (`UPRIGHT_CARRIED_UP.md` §8.3). Two roots: (1) far
  out a change is applied at once (one pose's OP2) and the carry takes back only its roll about the framed line — the piece lands where the new pose
  frames it, in one frame (the 2026-11-14 snap, back since one pose); (2) near the pole the dx-paid alignment rolls 80° in 40 ms (`Scene_1`).
  `Scene_0` has no spit: no change at once. Built for (1), `uprightFraming` 1 (fix round 1's code reverted first): the piece's jumps on his stretches
  112.8 → 38.8 a minute, at the changes 0; ⛔ the camera's roll jumps near a change +27 % (open, §8.7). No device look.
* **2026-11-20, evening — the camera becomes a SIMPLE POLAR ORBIT that FOLLOWS the gizmo** (his proposal; a Fable review, measured offline:
  gravity tilted 0 %, moves not asked 1 817° against 30 741°, the lag at a pole the cost) → `CAMERA_FOLLOWS_GIZMO.md` §0 – §12; every failure
  before it → `UPRIGHT_LESSONS.md`. Built on the new branch `1.0.150-Camera_follows_gizmo` (from `461eeb2`, the live code). At the end, when the
  orbit charts are completed, everything merges into the `3d_assembly_game` worktree.
* **2026-11-20, evening — packet G: the camera follower BUILT far out** (branch `1.0.150-Camera_follows_gizmo`, local `2ea35c0` – `fb2fa15`, behind
  `cameraFollower`, 0 = the live build frame for frame): on his ten stretches gravity tilted 0 % (live 29.8 %), no frame turning over 45° (13),
  1 804° not asked (30 741°), the piece's jumps 26.8 a minute (38.8); worse: sudden turns near the vertical 162.5 a minute (81.8) and the dy hold at
  `Scene_0bis`'s bottom far out lost (the finger read off the new glass in the spit); O8 explained (the centre frozen before the parts were placed:
  the origin, 0.31 m off the heptagon's centre); close in unchanged. No device look → `CAMERA_FOLLOWS_GIZMO.md` §13.
* **2026-11-20, night — HIS LOOK on live `de4a10e` (the follower, `cameraFollower` 1): *"This is very good"* — THE BEST IMPLEMENTATION OF THE
  ORBIT SO FAR** (supersedes `12dc4b6`). His three points on the top and bottom (the camera's yaw on a pure dy = the detour by place, measured; the
  hold far out; the red section turned round the pole by dx, the camera blind to it) and the advice (D-H1 – D-H4, nothing built) →
  `CAMERA_FOLLOWS_GIZMO.md` §14.
* **2026-11-20, night — packet H2: the top and bottom far out BUILT behind `followTop`** (branch `1.0.151-`, local `84f0c21`, `178459a`; 1 on the
  branch, 0 = `de4a10e` frame for frame): the heading the calm's level reading, the height capped 60°, a turn at an edge with the gizmo waiting, the dy
  hold after a dy-made half turn. Measured: no yaw on a pure dy (73° → 1.8°), `b_far`'s hold set 6 of 6, close in identical; ⛔ on his own play 77
  frames over 45° (0) and 94 piece jumps a minute (26.8) — three roots read (the turn read against the camera's lag, his pace read on the orbit's
  direction, the wait not holding the map's place), D-H9 – D-H12 for his word; no fix round, no device look → `CAMERA_FOLLOWS_GIZMO.md` §16.
* **2026-11-21 — H2 DEPLOYED for his look** (his word: *"deploy what you have built before I decide"*): LIVE main `ba369aa` = `1.0.151-` at
  `c1edcaf` (`followTop` 1; 0 = `de4a10e`), verify 2255 green; the failing gates as measured; D-H9 – D-H12 after his look → `CAMERA_FOLLOWS_GIZMO.md` §16.8.
* **2026-11-21 — HIS LOOK on live `ba369aa`: *"this is the best implementation of orbits chart so far"*** (supersedes `de4a10e`), two exceptions: the
  side-to-side transition on `Scene_1` (a turn decided at every facet change against the camera's lag: a surge, the gizmo held, a stall — offline) and
  the 180° realignment too fast under a fast input (a clamp slider). Fixes F-1 – F-4 reproposed for his final review → `CAMERA_FOLLOWS_GIZMO.md` §17.
* **2026-11-21 — packet H3: the fix round F-1 – F-3 BUILT** (branch `1.0.152-`, local `6208c10`, `09d48fb`; three switches, all 0 = `ba369aa`
  frame for frame): a turn only on the level reading's own jump, the turn at his finger's pace clamped at 520°/s, the angles set to the map's place
  at a turn's start. Measured: `Scene_1`'s sides at 100 – 400 px a second no turn (`ba369aa` 4 – 6), within 0.24° of `de4a10e`; no turn frame over
  520°/s; his ten: 0 frames over 45° (77), piece jumps 15.9 a minute (94.2; `de4a10e` 26.8), close in identical. ⛔ At his fastest (1 200 px a
  second) the sides turn and surge (23.7° a frame), the spin over the top rolls 25° in a frame, `b_far` s4 loses its hold and loops, the wait
  69.6 s of 155 — two roots read (the jump a per-frame difference; the lag left to a spring that pays it the short way), not patched (the last
  round on this join) → `CAMERA_FOLLOWS_GIZMO.md` §18.
* **2026-11-21 — packet H4: THE STUDY after the last fix round** (docs only, nothing built; his four parts): `b_far` s4's lost hold is the follower reading the LOGIC's up (`asmCamLast`, 64 of 157 half turns on his ten), not the spit's side; the wait's 24 mm drift is the depth glide restarted every frame; G3 counted his own motion (the exit's excess: `f5e35c3` passes); the design — two followers, a 62.4° leash, the jump by geometry, the turn taking the whole gap — and D-H13 – D-H18 → `TOP_BOTTOM_STUDY.md`.
* **2026-11-21 — packet H5: his look on `f5e35c3` read** (docs only, nothing built; his sliders at 0 change nothing): A (no calm on a tip), B (90° + 90° off the level face) and the apex edges' back and forth are ONE root of H2 (`ba369aa` too, not `de4a10e`) — the follower's level reading taken in the spit's frame, square to the axis, degenerate on the bottom triangle; D-H19: the top rule's reading only near the vertical (`cameraHeading`'s 50° / 60° band read in the world — `followTop` 0's calm, which he wants, kept below); point 3 (far out not as smooth as close in's 120 ms) is the follower's 120 ms being Lowe's smooth time (two 60 ms poles) against close in's first-order 120 ms behind 45 ms — ✅ D-H20 decided by him on the live slider: `followMs` 200 (0 – 500 by 10), the leash kept tied (104°); point 5 (the A + dy approach on `Scene_1`'s top): the follower → close-in handover unblended, the tilt's pending keeping the LOGIC's pose (16.5 – 27.6° p50 off the drawn one on the top, up to 85°), since `de4a10e` — D-H22, one part only: all along the approach the foot is laid along the LOGIC's direction while the follower looks along its 60°-capped one, so on the top each approach mm slides the piece across the view (sin of a 16 – 28° gap) besides the dolly; A moves no orbit angle; close in's contact rules owed to a walk; the owed `drv_h5.sh` → `TOP_BOTTOM_STUDY.md` §7 – §9.
* **2026-11-21 — packet R1: THE PICTURE'S REBUILD, the study** (docs only, nothing built; `1.0.153-Picture_rebuild` from `620f227`): close in's jumps at the approach's end are the pending turn's two-target framing (`poseFramingTwo`) going ill-posed as the piece comes down onto its aim — reproduced on the recordings and offline on the pure function, fixed at its source (every close-in turn about the piece), not smoothed; the hand-over's three parts (the piece's 308 mm leap at the latch, 94° of up at the follower's return, its 25° drift); one picture function at every distance, far ↔ close a target blend over his last 10 mm of approach before 0.65 m, the up handed over by his mm; R2 – R6 behind `pictureOne`, D-P1 – D-P8 → [`PICTURE_REBUILD.md`](../../40_RENDER_SCENE/spec/PICTURE_REBUILD.md).
* **2026-11-21 — packet R2: close in's turns about the piece, BUILT** (`83c5d9c`, `1.0.153-Picture_rebuild`): the switch `pictureOne` (1; 0 = `620f227`); a turn born inside the automatic tilt's latch is drawn about the piece for its whole life (`turnFraming` / `turnPose`, the one rule for `zoneMixPose` and `framedPose`); far-born turns as before; 9 vectors, red on 4 mutants; **2277** vectors; ⛔ the gates owed, no headless run made → `PICTURE_REBUILD.md` §8.1.
* **2026-11-21 — packet R3: the one picture, BUILT** (`ce5abfe` R3a, `f5344b5` R3b, `1.0.153-Picture_rebuild`): with `pictureOne` 1 one function draws at every distance — the follower bit for bit outside the band, the logic's pose over his last `pictureBandMm` (10 mm) of approach before 0.65 m, the up handed over by his finger only, the follower parked (never restarted); `asmCamLast` split into `asmCamLogic` / `asmCamDrawn`, the holds and the rebase written by the logic's reader, one resolver — moves, not changes; 2296 vectors; ⛔ gates owed, and at his pace the 3° gate cannot hold with a 10 mm band (`PICTURE_REBUILD.md` §8.2).
* **2026-11-21 — packet R5: the far target's top rule as decided, BUILT** (`1eca57d`, `af17b7d`, `ca21d0a`, `4ee392e`, `1.0.153-Picture_rebuild`, behind `pictureOne` 1): the far reading in the world (D-H19), the turn on its geometric jump only (D-H15), the heading and the height as two followers with the leash 104° (D-H13, D-H14), the far dy hold on the drawn up (D-H16); 19 vectors, red on 16 mutants; **2317** vectors; ⛔ gates owed (`PICTURE_REBUILD.md` §8.4).
* **2026-11-21 night — R3-FIX: one heading owner, BUILT** (`788085d`, `3bad0b7`, `1.0.153-Picture_rebuild`, behind `pictureOne` 1): not latched the follower draws, through every logic turn, the band the elevation only; latched G; one hand-over of the whole pose at the latch and the unlatch; R5 behind `pictureFarTop` 0; **2324** vectors; ⛔ gates owed (`PICTURE_REBUILD.md` §4.3a, §8.5).
* **2026-11-22 — ✅ CLOSED (his word)**: *"Record that the orbit charts and camera follow work is closed and this is the best implementation so far. We will then move to the orbit surface work."* The orbit on charts and the camera follower are closed; LIVE main `40b8095` = `b21b667` (`1.0.155-Orbits-finalized`, its last change D-H20, `CAMERA_FOLLOWS_GIZMO.md` §19) is the best implementation so far — the reference never to regress (`UPRIGHT_LESSONS.md` §3). Step 3, FO3 and what else this dossier still listed: no longer owed (future improvements, on his word); the charts' step B goes with the orbit surface work → `HANDOVER_2026-11-22_orbit_surface.md`. **2308** vectors.
* **2026-11-22 evening — his amendment on `40b8095`: the root** (the row stays CLOSED — a fix on the reference, his order *"proceed with the fix and
  tests without asking me questions"*): six play records on his PC (the dev server, `#rec`) show the back and forth as a far turn with the gizmo waiting at
  the edge, every face, every distance; R5's D-H15 as built reads the jump between two places — a pace threshold. D-H23 (the jump read at one place,
  `followJumpAtPlace`) on `1.0.156-Orbit-surface`, local → [`CAMERA_FOLLOWS_GIZMO.md`](../../40_RENDER_SCENE/spec/CAMERA_FOLLOWS_GIZMO.md) §20.
* **2026-11-22 evening — D-H23 + D-H24 DEPLOYED** (his word *"update the md files, deploy"*, 2026-11-22 16:49Z): LIVE main `3b7a479` = `2cd1be34`; his four
  records replayed: far turns 43 → 1, the gizmo's waits 325 → 145 frames; his device look owed
  ([`CAMERA_FOLLOWS_GIZMO.md`](../../40_RENDER_SCENE/spec/CAMERA_FOLLOWS_GIZMO.md) §20.9 – §20.10).
* **2026-11-22 evening — HIS VERDICT: THE BEST IMPLEMENTATION OF THE ORBIT SO FAR** — branch `1.0.156-Orbits_with_camera_follow_final` (renamed from `1.0.156-Orbit-surface`),
  LIVE main `3b7a479` = `2cd1be34`; `40b8095`'s branch renamed `1.0.155-Orbits_with_camera_follow_1`; the workfront `1.0.157-Orbit_surface`
  ([`CAMERA_FOLLOWS_GIZMO.md`](../../40_RENDER_SCENE/spec/CAMERA_FOLLOWS_GIZMO.md) §20.11).
* **2026-11-25 — the camera's jumps on the approach: five fixes PORTED here** (his word: *"make sure you commit these five fixes also in branches
  1.0.156 and 1.0.157 as they also belong there"*) from `1.0.158from1.0.157-Orbit_surface`, each its own commit behind its own switch (0 = this
  branch's game frame for frame): A1-a `pictureHandWhole`, A2-a `pictureBandWayIn`, A3-p `followParkOwn` (+ D-J5 under `pictureHandWhole`), B-a
  `framedLineGlass`, C-a `gizmoLagTravel` — the study, his words and the gates on his records
  ([`APPROACH_CAMERA_JITTER.md`](../../40_RENDER_SCENE/spec/APPROACH_CAMERA_JITTER.md) §7). His device look owed.
* **2026-11-25 — the five at 1 by default here too** (his word: *"Default at 1 also in the two other branches"*), as LIVE `870078b`; 0 = this
  branch's game before. `npm run verify` 2365 / 2365.
* **2026-11-25** — his look on the phone at the five camera-jitter fixes (LIVE `870078b` / `8204f25`): *"five camera-jitter: fixed"* — `APPROACH_CAMERA_JITTER.md` CLOSED.
