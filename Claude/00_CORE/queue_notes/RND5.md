# RND5 — The orbit on charts

> **STATUS** · ✅ spec APPROVED 2026-11-15; ✅ steps 1.1 – 1.4 built and audited (not wired, the game unchanged); ✅ step 2.1 (the baseline, the inventory); 🔧 step 2.2 built and DEPLOYED (main `7db32b6`, the switch off by default), the owner's look owed · **OWNS** · one layout rule for the orbit on any simple shape
> **LAST VERIFIED** · 2026-11-15

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
