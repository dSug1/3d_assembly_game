# PICK AND PLACE — picking a part, putting it down, the two orbits, the snap (any scene)

> **STATUS** · 🔧 BUILT 2026-11-14 (`1.0.143from1.0.142-Pick-up-of-parts`), headless only — ⛔ no device look (§12) · **OWNS** · the play loop from a loose part to a seated
> one: the pick, the put-down, the switch between the SCENE ORBIT and the PIECE ORBIT, the step after a snap
> **READ IF** · you build or change how a part is chosen, held, dropped or seated, or how the camera goes from browsing to the part in hand
> **LAST VERIFIED** · 2026-11-14

⭐ Written for EVERY scene (the owner: *"the md files shall be written as applicable for any scene"*); `Scene_2` is the first to use it
(`30_OBJECTS_3D/spec/SCENE_2_ASSEMBLY.md`). The decisions, the options weighed and the literature: [`../history/2026-11-14_pick_and_place_decisions.md`](../history/2026-11-14_pick_and_place_decisions.md).
The queue: `GM10` – `GM12`, and `CL1` (the clean-up) BEFORE them (§10).

## 1. The two orbits (named 2026-11-14 — `SCENE_2_ASSEMBLY.md` §5 item 7)

* **The SCENE ORBIT** — no part in hand: the camera on the scene's four rings round the orbit centre; a press moves the centre (browsing);
  ⛔ no approach.
* **The PIECE ORBIT** — a part in hand: the polar and tilted-poles orbits (`40_RENDER_SCENE/spec/PIECE_ORBIT.md`, `ORBIT_ANY_SHAPE.md`), the
  approach (A + dy, the pinch); ⭐ the camera looks at the orbit centre, which IS the gizmo (D3, 2026-11-04: *"center of the orbit = gizmo"*;
  `render/green_box_wiring.ts`, *"the camera looks at the yellow target (orbit center)"*).

## 2. ⭐ Picking a part (in the scene orbit)

1. **A TAP on a part picks it up** (the owner: *"I select a tap on a piece to pick it up"*); the mouse: a left click. A tap = released within
   `tapMaxDuration` and inside the motion deadband (INPUT); a press that drags stays the scene orbit (browsing, unchanged).
2. **The browse it started is cancelled** — the press had armed the centre's glide (`st.browseGlide`, `render/pointer_wiring.ts`); the pick clears
   it (the centre never moved: a still finger moves nothing). ⭐ The yellow centre marker (`st.centreMarker`, hidden since 2026-10-02) is not
   needed (the owner: *"no need for a marker … commented out"*).
3. **The finger target** (the owner: OK): a part's hit area at least **9 mm** on the glass (Parhi, Karlson & Bederson 2006); the NEAREST part to
   the finger wins (the bubble cursor, Grossman & Balakrishnan 2005).
4. **Two parts within reach — TAP AGAIN TO CYCLE** (the owner: *"no magnified chooser: tap again to cycle to the other part (this is the only case
   another part can be chosen without putting the picked up part down) only if this is the immediate next input and no other input has started
   (orbit, etc.)"*): the next input, a tap on the other candidate, swaps the held part for it (the first goes back where it lay).
5. **WHICH PARTS** (the owner: *"Placed; next steps only"*): only the parts whose STEP IS AVAILABLE (every step before it in the scene's plan
   placed — W1's partial order) are pickable, and those are OUTLINED; the others have no outline and a tap on them browses as today.
   * The outlines DISAPPEAR when a part is picked up and REAPPEAR when a part is PLACED (and the level is not complete).
   * ⚠ Licence (`CONSTRAINTS.md` §1): built on Babylon.js's own outline / highlight rendering (Apache-2.0, already shipped) — an inverted-hull or
     highlight-layer outline, a long-published technique; recorded in `THIRD_PARTY_NOTICES.md` / `10_INPUT_TOUCH/PROVENANCE.md` when built (not
     legal advice).
6. **Feedback**: the outline; the part lifts (§5); its CONTACT SHADOW fades and spreads as it lifts and the real shadow follows the part (§9); the
   camera blends from its scene-orbit pose to its piece-orbit pose (offset behind the part, §5). Haptics: Android only (iOS Safari has no
   Vibration API — `IN7`).

## 3. ⭐ Putting a part down (the wrong part)

1. **A DOUBLE TAP on the held piece puts it down** (the owner: *"a double-tap on the same piece to put it down"*); the mouse: a left double click.
   ⭐ Free: the undo (`D111`/`D141`) is deleted (2026-11-02, `queue_notes/IN6.md`); the double tap's only other use is `Scene_1`'s stuck-piece
   respawn (`pieceTapAction`), which stays there until `Scene_1` moves to this flow (§10).
2. ⭐⭐ **A SINGLE tap on the held piece waits for the double-tap window** (the owner: *"Delay the tap"*): today a tap on the held piece turns its
   tapped face to the resting face at once — a double tap would turn it first; now the single tap acts only when the window (~300 ms) passes
   with no second tap. ⚠ Every face tap on the held piece feels that much later.
3. **WHERE** (the owner: *"a free spot close to current position, respecting the rules I set for the boot (margins, no stack, etc.)"*): the free spot
   NEAREST the piece's current position (seen from above) that passes the boot's rules — on the floor, ONE HIGH (no outline over another, both
   ways the eye counts), outside the plinth's perimeter, inside the floor's margin, a rest that holds (`SCENE_2_ASSEMBLY.md` §2.5,
   `core/boot_heaps.ts`).
4. **HOW IT RESTS** (the owner: *"piece is put down the closest to vertically to the position defined previously. The quaternion rotates the least
   possible to make the piece rest on the floor"*): the stable face whose rest needs the SMALLEST turn from the piece's current orientation.
   ⚠ New: the boot draws its faces at random (any stable face, any yaw) — this one is the least turn.
5. **No punishment** — the literature's rule (Unpacking, 2021: strict placement frustrated its playtesters): a wrong part just goes back.

## 4. Taps on other parts while a piece is held (the owner, 2026-11-14 — as today)

* a tap on a **PLACED** part moves the gizmo there (`orbitTargetOnRelease`, unchanged);
* a tap on a **LOOSE** part acts as a tap on empty space (the yellow quad's turn, unchanged);
* ⭐ the one exception: the CYCLE (§2 item 4) — the immediate next input after a pick, on the other candidate.

## 5. ⭐ From the scene orbit to the piece orbit (at the pick)

1. **Driven by the CLOCK** (the owner: *"a clock. Hold the inputs until the piece orbit is ready (piece in position, camera in position)"*) —
   allowed by `40_RENDER_SCENE/spec/ANIMATION.md` §1 (what the GAME does on its own). ⛔ Every scene input is held until the piece AND the camera
   are in place and aligned (as the boot holds them, `ANIMATION.md` §4); then the piece orbit starts.
2. **The piece's place** (the owner: *"On the orbit line"*): the PIECE ORBIT's own pose for the camera's current yaw, at the HIGHEST pitch at the
   orbit's distance (the owner: *"lifts up vertically from where it is up to the highest position in the piece orbit at this distance"* — the
   vertical lift becomes the future animation's first leg, §9).
3. **The gizmo**: where the face map puts it for the camera's direction — the camera looks at the gizmo, so the face facing the camera most (the
   owner: *"if the camera looks at the gizmo, the gizmo positions at the center of the face facing the camera most"*).
4. **The piece's orientation** (the owner: *"aligned with the quad which quaternion is the closest to the piece quaternion in its boot position (or put
   down position)"*): of the resting-face quads, the one whose orientation is NEAREST the piece's orientation as it lay; the turn from one to the
   other is the future animation's.
5. **The quads of a `.glb` part** come from its FACE PROXY (`30_OBJECTS_3D/spec/PART_AUTHORING.md` §3) — ⚠ to troubleshoot properly: some parts
   have MANY proxy faces (a candidate per face would be too many quads).
6. **The camera** (the owner: *"the camera blends its view towards the gizmo … while blending towards its piece orbit's position. Piece orbit starts
   only when the piece and camera are positioned and aligned"*): its view toward the gizmo and its place toward the piece-orbit pose (offset behind
   the piece, `cameraRadiusOffsetMm`), together.

## 6. ⭐ Switching between the two orbits (the owner, 2026-11-14)

> *"scene orbit toggles on if no piece is picked up. If a piece is picked up and a finger is pressed / mouse button is clicked, piece orbit is on and
> does not toggle off. If piece is picked up and no finger is pressed and no input for xx s (timer already set), the camera blends to scene orbit
> idle movement and blends back to piece orbit when input resumes. Make sure that any position in piece orbit is reachable by scene orbit. If
> required, extend scene orbit rings radius and heights."*

| state | the orbit |
|---|---|
| no part held | the SCENE ORBIT |
| a part held, an input | the PIECE ORBIT — never toggles off by itself |
| a part held, no input for the idle timer (`idleOrbitAfterS`, `ANIMATION.md` §4) | the camera blends to the SCENE ORBIT's IDLE movement; back to the piece orbit when an input resumes |
| the part put down (§3) or placed (§7) | the SCENE ORBIT |

⚠ **Every piece-orbit pose must be reachable by the scene orbit** (the blends both ways): the scene's rings extended in radius and height where
needed — measured per scene.

## 7. ⭐ The snap and the next step

1. **The seat**: the goal capture as built (`LEVEL_END.md` §5quater, §5quinquies: the orbited piece's 5 mm / 3°, then EXACTLY on its goal); the
   PLUNGE snap for a hole (`SCENE_2_ASSEMBLY.md` §5 item 8, owed).
2. **The placed parts become the ASSEMBLY the face map reads**, rebuilt at each snap (the owner: *"correct. Capture that in the md files"*).
3. **The orbit centre** (the owner: *"for the moment, orbit center blends to the center of the piece which will support the next piece to be
   assembled"*): after a snap, the centre blends to the centre of the part that SUPPORTS the next part (`SCENE_2_ASSEMBLY.md` §2.8, read that way);
   then the SCENE ORBIT (no part held) and the outlines back (§2 item 5).
4. **The level complete** (the owner: *"the orbit center becomes the center of the assembly and the orbit toggles back to scene orbit"*).
5. ⛔ **NO UNDO** after a snap (the owner: *"this should not happen"*).

## 8. The score (`SCORE.md` §3)

The owner: *"Pick and put-down only"* — a pick-up costs ONE episode, a put-down ONE; the snap NONE (it is the goal capture, automatic). A wrong
part costs two.

## 9. Animations and sound — NOT NOW

The owner: *"for the moment, record that in the md files. No animation. Just spawn the piece in lifted position / quaternion or put down position
/ quaternion when we pick up or put down and we will build the animation later on."* The poses are SPAWNED; the motions are queued in
`40_RENDER_SCENE/spec/ANIMATION.md` §4 (the pick-up's lift, the put-back, the snap, the plunge, the cap's pop). ⛔ No carry over the assembly
(the owner: *"not necessary: the camera orbits to reach its position"*). ⏳ Sound: later (`GM9`).

## 10. ⭐ Before building: the clean-up (`CL1`), and what stays

1. **`CL1` first** (the owner: *"Clear the dead and parked code first, with a bit-for-bit check on Scene_1, as was done for the slider clean-up"*):
   the code with no live caller (the old way in / out round the piece, `piece_orbit.ts`'s entry / return / aim, the parked hold decisions, the
   `Recognizer` class, the constraint stack, `testMate` / `mateResidual`, the router's OBJECT and SECOND roles, ~1 700 lines) and the parked code
   (`EMPTY_PRESS_MOVES_TARGET`, the pending centre, the barycentre centre, ~170 lines) → `queue_notes/CL1.md`.
2. **Kept**: the LEGACY `orbitMode` 1 (the owner: *"Keep for now"*); `Scene_1`'s green / turquoise pieces, the menu's piece switch, the stuck
   respawn and the demo (the owner: *"Keep, migrate later"* — `Scene_1` moves to this flow once it works on `Scene_2`).
3. **Then** the piece orbit freed from its `st.greenBox !== null` gate (today `Scene_2` has no orbited piece, so no piece orbit runs there), then
   `GM10` – `GM12`.

## 11. Open — to settle while building

1. ⚠ The lifted pose AT THE HIGHEST PITCH (§5 item 2) and the gizmo on the face facing the camera (§5 item 3): at the top the camera looks DOWN
   at the assembly's top face — to check on the device that the two read as the owner meant.
2. ⚠ The quads from the face proxy (§5 item 5): how many candidates a part with many proxy faces gets.
3. ⚠ The scene rings' reach (§6): measured per scene, `Scene_2` first.
4. ⏳ Making a `.glb` part an orbited piece (its collision pieces, face proxy, quads, goal, symmetry, lift) — the workflow written while walking it
   on `Scene_2` (`SCENE_WORKFLOW.md` W5).

## 12. ⭐⭐ AS BUILT (2026-11-14) — and the decisions taken while building (⚠ for the owner's review)

**Where it lives**: `core/model_bodies.ts` (engine-free: the scene / world frames — `world = unitM · (−x, y, z)`, a rotation across as `(w, x, −y, −z)` —
a part's body framed by the world at its goal, its pose both ways, the pickable rule, the put-down's spot), `core/glb_geometry.ts` (`partFaces`: the face
proxy from the `.glb`), `render/model_bodies_wiring.ts` (the flow), hooked from `render/model_import.ts` once the boot has settled and from the render loop
(`st.modelHooks`); `SceneObject.pieces` (a body's own convex pieces — the `UCX_` — read by the collision, `core/collision.ts`); the goal symmetry `spinX`.
**Checked**: `tests/model_bodies.test.ts` (12, each with its counter-example; the face proxies' winding through the mirror on the real engine);
`scripts/probes/pick_probe.mjs` (25 checks, headless, virtual clock: boot, pick, put-down, pick, seat, the next step outlined and picked, the orbit after
the switch, the single tap held for its window, a drag during a switch moving nothing, the crank's thin bar within the 9 mm reach, the idle blend);
`scripts/probes/seat_probe.mjs` — ⭐ **the lower case SEATED through the game's own steps** (picked; its bottom the resting face; the top quad; the roll;
A + drag in): captured, committed, out of the hand, the crankshaft outlined next. `Scene_1` and `Scene_0bis` replayed bit for bit (`replay_probe.mjs`).

**Root causes found and fixed while building** (each from a probe, ⛔ no patch kept that did not fix its cause):
1. the resting-face QUADS never showed for a `.glb` part — their rule asked the piece's mesh to be drawn, and the proxy never is (`orient_cube.ts`);
2. …and they hide nearer than half the rings' farthest (`quadsShownFromM`; `Scene_2` 3.1 m): a part picked at its own distance (≈ 0.9 m) could never be
   turned — on its side at contact, 90° off, never placed. ⭐ The pick's distance is now at least where the quads show;
3. the put-down's spiral started where the part was HELD — beyond the floor once the piece orbit is 3 m out: "no free spot", stuck in hand. ⭐ It starts
   at the floor's nearest point (a vector fails on the old rule);
4. the scene orbit's way back took the ring PLACE nearest the camera — a ring surface cannot hold the piece orbit's places (it has a distance): the camera
   dropped to the bottom ring. ⭐ Now the ring that looks from the camera's DIRECTION;
5. the held part's double tap missed a thin part (the crank's bar) — ⭐ the same 9 mm reach as the pick.
6. Found in the tests (`CL1`): two regexes with literal backspaces for `` (could never fail), one check passing on a line of dead code.

**DECISIONS TAKEN (to review)**:
- **D-1 · the step order**: a part is pickable when EVERY part of a lower `step` is placed — the file carries the plan's partial order only as step groups
  (both banks 5, the six pistons 6, the pulley 9): stricter than §2.3 of `SCENE_2_ASSEMBLY.md` (the pulley "any time after step 3"; a bank's pistons
  before the other bank). ⏳ A per-part `after` in the `.glb` would carry the true order.
- **D-2 · the anchor**: the plinth (`frozen` in the file) is a PLACED body, not a frozen one — the face map reads only unfrozen placed parts (its top is
  the lower case's gizmo route); nothing moves a placed part.
- **D-3 · the pick's distance**: the larger of the part's own distance from the assembly and 1.05 × where the quads show (`Scene_2`: ≈ 3.3 m) — so the
  part can be turned before it comes in. ⚠ At the highest pitch (the pole, the owner's choice) the yellow CANDIDATE quad was a side's (the probe:
  (1, 0, 0)); a tap on the quad wanted turns the part right.
- **D-4 · the way back to the scene orbit**: from the camera's yaw and pitch, the ring at the nearest distance among equals. ⛔ The rings were NOT
  extended: a ring surface cannot hold every piece-orbit place, and `Scene_2`'s rings (−37° … +41° of pitch) set the boot view the owner approved —
  a piece-orbit view from higher swings down on the way back. ⏳ The owner's call: a higher, narrower top ring.
- **D-5 · after a snap**: the centre to the centre of the part JUST PLACED (the file names no host per step — the support of the next part is most
  often the last one placed: the case for the crank); the level complete: the assembly's centre.
- **D-6 · a tap on a placed part while holding** moves NO gizmo — around the assembly the ray places it (`retargetGizmo`, 2026-10-28): "as today" is that.
- **D-7 · a single tap on the held part** picks a resting face only where it meets a face of the part's FACE PROXY (a piston's: one face) — elsewhere
  nothing.
- **D-8 · the pulley's `spinFree`** → `spinX`: any turn about its own x, every 5° (the 3° margin covers it).
- **D-9 · the stage slider** (`modelStage`) is inert once the parts are bodies.
- **D-10 · the idle blend**: the camera along its own direction to the scene orbit's boot distance (3 m), looking at the assembly's centre; the idle orbit
  plays on top; back by the clock on an input.
- **D-11 · the score**: a pick 1, a put-down 1, a cycle's swap 0 (its pick counted), a snap 0.
- **D-12 · loose parts are obstacles** to the held part (as every body) — ⏳ to judge on the device whether the heaps should be passed through.

**NOT DONE — measured**: from the CRANKSHAFT on, the seats lie inside a host (the tub's saddles, the bores): the gizmo needs the GHOST faces read for the
held part (`SCENE_2_ASSEMBLY.md` §5 item 9) and the PLUNGE snap (§5 item 8) — both owed. The seat probe: the crank turned right (0°) stops on the
plinth's top beside the case, 192 mm from its goal. The CYCLE is built but not walked headless (no two pickable parts within reach in the seeds tried).
⛔ **Owed: the owner's look on the device** — nothing here is closed by it.
