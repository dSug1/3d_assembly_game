# RND5 — The orbit on charts

> **STATUS** · ✅ spec APPROVED 2026-11-15; ✅ steps 1.1 – 1.4 built and audited (not wired, the game unchanged); 🔧 step 2.1 next · **OWNS** · one layout rule for the orbit on any simple shape
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
  Owed in 2.1: the inventory of the wiring's orbit state and of the specificities' paths.
* **The owner, the same day**: test scenes of the builder's choice may live in ANOTHER worktree, reviewed then deleted by the owner (the spec's §7.2).
* **The owner, the same day**: how the specificities (holes, voids, channels, mouths, protrusions) are handled → the spec's §4.4: untouched below the
  charts; the mouth's hand-over is coupled to the tilt and is carried over at step 2.4; `Scene_2`'s contour is not measured yet.
