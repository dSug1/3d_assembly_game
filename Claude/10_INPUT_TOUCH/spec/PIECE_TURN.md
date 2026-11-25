# PIECE_TURN — the piece zone: the piece turned by a drag on it, the step back to turn, the roll, the face tap, the undo (`IN14`)

> **STATUS** · 🔧 **BUILT 2026-11-25 night** (his word: *"proceed as you recommended (md files, packets) … Do not stop until you finish all the
> packets … Deploy at the end so I can test"*) on `1.0.159-Orbit_of_piece`, under the switch **`pieceTurnZone`** (1 = this page, the default; 0 = the
> inputs as on LIVE `fe917b8`). Gated headless (§8.2). ⛔ No device look yet (rule 5) — **his look closes it**. The packets: §7; as built: §8.
> **OWNS** · what a press near the held piece does, the piece's own turn, the step back, the roll, the face tap, the undo
> **READ IF** · you touch a gesture on the held piece, the resting-face quads, or Scene_2's taps
> **LAST VERIFIED** · 2026-11-25 (written from the code of `9dacca36`)

## 0. His words

<!-- VERBATIM-BEGIN -->
> I want to modify as follows: - a left click/press close to the piece (radius of the input's capture sphere to be defined by slider, set as default as the
> piece's max dimension + xx mm slider ) A) toggles the orbit of the piece itself (and toggles off the orbit of the piece and camera around the orbit's
> center; note: a left click/press outside this input's capture sphere is a normal orbit around the orbit's center). B) - the quads appear and the resting
> face highlights whatever the distance of the piece to the assembly - the yaw and pitch of the piece scrolls the quad which are highlighted in turns (same
> rule as current for how much yaw and pitch change toggles the next quad). when the left click/press is released the resting face snaps to the
> highlighted quad and then the quads and resting face highlight fade away - a left click tap/finger tap on the face selects the resting face whatever the
> distance - the roll of the piece for resting face alignment is done by A + left click within the input's capture sphere or zoom pitch movement on
> mobile when the first finger is already controlling the orbit of the piece ifself. In such cases the approach of the piece towards the assembly is
> toggled off (it is toggled on if the input happens outside of the input's capture sphere) - a double tap or double click anywhere cancels the last
> action (orbit of piece itself or selectio of resting face or roll of the piece) Advise the loopholes in my proposal above, ask clarification if
> anything is unclear, highlight potential conflicts with other inputs mapped in all the scenes (in particular scene 2), recommend an improved version
> of my modification. Don't build anything yet.

then, on the lead's review (ten questions, each with a default):

> for all your questions, your defaults apply. Close in most turns collide: you are right: propose something to avoid this issue. Current inputs:
> provide a proposal, noting that most current inputs will be obsolete.

then, on the lead's proposal:

> three modifications:
> - first finger started in the zone, then second finger lands = > the turn snaps and then the twist (it means the first finger can be outside the zone
>   when the second finger lands due to dragged orbit and the snap + twist still triggers).
> - tap on a face of the piece : becomes the resting face and turns the least to the last selected quad (if not null) or (if null) the nearest
>   direction; the quads flash
> - A + left drag started in the zone (A can land anywhen during the piece's orbit) roll: dx right = clockwise, snaps on release
> - left click on a face of the piece : resting face, last selected quad (if not null) or (if null) the nearest direction
> Then proceed as you recommended (md files, packets). I will go to sleep. Do not stop until you finish all the packets. Commit periodically. Update the
> md files. Deploy at the end so I can test.
<!-- VERBATIM-END -->

**The defaults he accepted** (the review's ten questions): (1) the piece turns IN PLACE under the finger, the camera stays; (2) only while pressed (a
quasimode — never a toggle, `D66`); (3) the zone is the piece as drawn plus mm on the glass, with a cap; (4) the quads never shown outside a turn or a
face tap; (5) the tap on empty space (align / roll), the tap on a quad and the second finger's tap on empty space all removed — so a double tap on empty
space is free; (6) ⛔ superseded by his second modification; (7) both: a drag or a twist rolls continuously, a click or a tap one stop; the twist, not the
pinch; (8) ⛔ superseded by his third modification (A any time); (9) ⛔ superseded by the step back (§4.5): its rare fallback refuses at the start; (10)
the undo several steps within the hold, no redo, one episode each.

## 1. The rules (part 1 of his four-part method)

* **R1 — presence, not motion.** What a gesture does is decided by WHERE the first finger pressed (in the zone or not), latched at the press; nothing
  the finger does later moves it into another gesture — except the second finger and the A key, which his words name (§0).
* **R2 — only while pressed.** The piece turns while the finger is down; the release snaps; nothing stays on (`D66`: a press never toggles a mode).
* **R3 — taps go to what they hit.** The zone claims DRAGS only: a tap in it is the tap it always was (the piece's face, a placed part's gizmo, Scene_2's
  pick / cycle / put down).
* **R4 — never into a part.** No turn ever takes the piece into a placed or loose part (`COLLISION.md` §11): close in the piece STEPS BACK to turn (§4.5).
* **R5 — the camera stays.** A turn moves neither the camera nor the orbit; the reference orbit (`3b7a479` + the surface work) is untouched outside the zone.
* **R6 — mm on the glass** (rule 3): every threshold a slider in mm or degrees, one constant in one place.
* **R7 — one driver.** Once a second finger (or A) rolls, the first finger's own motion is inert until it lifts (`METHOD.md`: a driver and a validator, never a blend).
* **R8 — the budget.** 24 gap queries a frame, all checks included (`ORBIT_ANY_SHAPE.md` F5).
* **R9 — no view widget.** The quads guide the PIECE; they never select a view and the camera never turns to face one (the ViewCube condition, `no-3d-orientation-widget`).
* **R10 — provenance.** Every gesture tagged at adoption ([`../PROVENANCE.md`](../PROVENANCE.md), IN14's section).

## 2. Obstacles and fallbacks (part 2)

| obstacle | where | the answer |
|---|---|---|
| the piece is drawn near the glass's centre at every distance (the camera 1.25 m behind it, a 1 m piece in `Scene_1`) — a zone the piece's size would cover the screen | every scene | the zone CAPPED at a third of the short side (§4.1) |
| close in, a turn about the resting face's centre sweeps a sphere of the piece's whole length centred ON the contact side: most turns collide (today's red quad, refused taps) | close in | the turn about the piece's CENTRE, and the STEP BACK until its bounding sphere is free (§4.5) |
| the solver relocates a piece found inside its margin (≤ 3 cm along the ring) | the turn | the step back is part of the anchor the solver reads (`turnOffset` in `ringAnchorAt`): it sees the piece where it is, free |
| the picture places the camera on the line gizmo → piece (`pictureFrame`'s `hang`) | the camera | the picture reads the ring's place, never the turn's offset: the camera stays (R5) |
| the ring's hold re-bases on a move > 0.1 m in one frame (`REBASE_M`) | the step back | the step back eased, ≤ 0.08 m a frame |
| the way out along the approach line may meet a part (a piece in a channel it entered sideways) | the step back | the path checked by conservative advancement (Mirtich 1996); no room → the turn REFUSED at its start, the HUD says so, nothing moves, no episode |
| the way back in with the new pose may meet a part before the ring's place | the step back | back by checked steps to the ring's place or the first contact at the gap kept; what is left joins the ring's hold (`pieceHold`, released by its own checked steps) |
| a double tap's first tap already acts (pick, face, gizmo) | the undo | the undo only on EMPTY space, where a single tap now does nothing — no wait added to any tap |
| Scene_2: a double tap on the held part puts it down; a single one waits 300 ms then picks a face | Scene_2 | unchanged; the undo is never on the held part |
| Scene_2's second finger in a zone gesture would read as a tap on the held part | Scene_2 | the pick-up flow ignores a pointer the zone owns |
| Scene_2's idle blend draws the piece small, elsewhere | Scene_2 | no zone while the idle blend is out (the first press brings the view back) |
| the stuck check (the respawn) reads turns at the place, not stepped back | Scene_0/1 | kept as is — it arms only when the POSITION is stuck too; ⚠ noted (§6 D-P14) |

## 3. Prior art (part 3's sources) — tags in [`../PROVENANCE.md`](../PROVENANCE.md)

* the turn under the finger: the **virtual sphere** (Chen, Mountford & Sellen, SIGGRAPH 1988) and the **arcball** (Shoemake, Graphics Interface 1992) — here the
  simpler screen-axes form the project already uses (rule 2bis);
* **only while pressed**: the quasimode / kinesthetic hold (Sellen, Kurtenbach & Buxton, *The prevention of mode errors through sensory feedback*, HCI 1992;
  Raskin, *The Humane Interface*, 2000);
* the **two-finger twist** to rotate: universal on multi-touch since the 2007 phones; in the literature Hancock, Carpendale & Cockburn, *Shallow-depth 3D
  interaction*, CHI 2007;
* the **step back to turn** — retreat, re-orient, approach: Unimation's VAL robot language (1979), `DEPART` / `APPRO`; the bounding sphere is rotation-invariant
  (elementary geometry);
* the **sphere tracing** of the first free place on a line (Hart, *Sphere tracing*, The Visual Computer 1996) and **conservative advancement** (Mirtich 1996,
  already the project's — `COLLISION.md` §11octies);
* the snap to the nearest of a set of orientations: snap-dragging (Bier, I3D 1990), already the project's anchor for rule 2sexte.
⚠ The composite — the first finger in the zone, the second finger's twist rolling about the resting face's normal — is an INTERNAL COMPOSITION of the above.

## 4. The design (part 3)

### 4.1 The zone
A circle on the glass round the piece's centre as drawn (the centre of its collision shape's bounding sphere): radius = that sphere's radius on the glass +
**`pieceZoneMarginMm`** (5 mm), at least **`pieceZoneMinMm`** (9 mm — a pick's finger target), at most **`pieceZoneCapShare`** (0.33) × the glass's short
side. Latched at the first finger's press (a mouse's left button). **No zone**: no piece held, the piece placed, the scene orbit, Scene_2's switch or its
idle blend out, the switch at 0.

### 4.2 The press in the zone, and its commit
Nothing moves before the COMMIT: past the tap slop (`doubleTapSlop`, 8 mm), or past the orbit's deadband (`orbitDeadbandMm`, 2.3 mm) once the tap's time
(`tapMaxDuration`, 200 ms) is over. A release before the commit is a TAP — to what it hit (R3). At the commit: the orbit's and the approach's coasts stop,
the step back's room is asked (§4.5), the quads show.

### 4.3 The turn under the finger, the lit quad, the snap
* dx turns the piece about the screen's vertical, dy about its horizontal, **`pieceTurnDegPerMm`** (2°/mm) of finger travel since the press, about the
  piece's CENTRE; drawn eased over 40 ms toward the finger's.
* **The lit quad**: of the level's distinct directions (the quads' — `orientationFrames`), the one the resting face's normal is nearest to sitting against
  (anti-parallel); another takes over only when nearer by **`pieceTurnLitHysteresisDeg`** (3°). Its quad edged yellow; the quads and the resting face's
  contour at full size, at any distance.
* **The release**: the snap onto the lit direction — today's alignment (the least turn, then the long axes paired, `restAlignToFace`), eased 125 ms, about
  the centre; the quads held 300 ms then faded over 250 ms. The lit direction becomes **the last selected quad**.

### 4.4 The roll
* **Tablet** — the first finger STARTED in the zone (wherever it is now, his first modification); a second finger lands: the turn under way snaps (§4.3),
  then the TWIST of the two fingers (the angle of the line between them) rolls the piece about its resting face's normal, 1:1, clockwise on the glass =
  clockwise as seen; at the second finger's lift (or the first's) the roll snaps to the nearest edge stop (`nextCoupleRoll`'s couples: 90° the green
  piece, 60° the turquoise). A second finger's TAP (tap rules, under 10° of twist) = one stop clockwise. While the first stays down, more second-finger
  contacts roll again; its own moves are inert (R7).
* **Desktop** — A held at a press in the zone, or pressed ANY TIME during a zone drag (his third modification): the turn under way snaps, then **dx**
  rolls (**`pieceRollDegPerMm`**, 2°/mm, right = clockwise), snapping at the button's release or A's; a click in the zone with A held (no drag) = one
  stop clockwise.
* Outside the zone, A + drag and the pinch are the approach, as before.

### 4.5 The step back to turn
* The piece's bounding sphere about its centre (its collision shape's points, radius R): if the centre's gap to the placed and loose parts is at least
  R + the gap kept (`pieceGapMm`), EVERY turn is free — nothing is checked while it turns.
* Else the piece first glides OUT along the line from the gizmo through its anchor (the approach's own line) to the first place its sphere is free —
  found by sphere tracing (≤ 12 queries), the path checked by conservative advancement of the piece as it stands; eased, ≤ 0.08 m a frame.
* It turns there (the drag, the snap, the rolls, a face tap, an undo — quick ones follow each other there).
* 300 ms after the last turn it glides back IN by checked steps (the new pose) to the ring's place, or to the first contact at the gap kept; what is
  left joins the ring's hold (`pieceHold`).
* **Fallback**: no free place on the line (blocked first) → the turn is refused at its start, the HUD says *"no room to turn here — move out"*, nothing
  moves, no episode.
* It is a world offset on the anchor (`turnOffset`): the solver, the ring's hold, the approach and the stuck check read the piece where it is; the
  picture does not (R5).

### 4.6 The face tap
The face tapped becomes the resting face and the piece turns the least to rest it on **the last selected quad**, else (none) on the nearest direction to
that face; the rolls carried when the target is the same (as today); at any distance; through the step back; the quads flash (300 ms + 250 ms fade).
Scene_2: its 300 ms wait (the double tap puts down) unchanged.

### 4.7 The undo
A DOUBLE TAP (double click) on empty space, the floor or a loose part — never on the held piece, never on a placed part — while a piece is held: one
step back (the orientation, the resting face, the rolls, the last selected quad) per double tap, through the step back, one episode each. The history
(≤ 32) is cleared at a pick, a put down, a spawn or respawn, a goal capture. A single tap on empty space does nothing.

### 4.8 The input map with the switch at 1 (⭐ the summary in [`INPUTS_TABLE.md`](INPUTS_TABLE.md) §0)
| device | input | does |
|---|---|---|
| both | a drag started OUTSIDE the zone | the orbit round the assembly (unchanged) |
| tablet | a pinch, the first finger outside the zone | the approach (unchanged) |
| desktop | A + left drag started outside the zone (A live mid-drag) | the approach (unchanged) |
| both | a tap / click on a placed part | the gizmo there (unchanged) |
| both | a drag started IN the zone | the piece turns; the release snaps to the lit quad (§4.3) |
| tablet | first finger started in the zone + a second finger: twist / tap | the roll, continuous / one stop (§4.4) |
| desktop | A at the press or during a zone drag: dx / a click with A in the zone | the roll, continuous / one stop (§4.4) |
| both | a tap / click on a face of the piece | its resting face, onto the last selected quad else the nearest (§4.6) |
| both | a double tap / double click on empty space | the undo (§4.7) |
| both | a double tap on the stuck piece (Scene_0 / 0bis / 1) | the respawn (unchanged) |
| Scene_2 | tap a part / the cycle / a double tap on the held part / the idle blend | unchanged (`PICK_AND_PLACE.md`) |
| both | the ⏸ button | the pause menu (unchanged) |

**Obsolete with the switch at 1** (inert, their code kept for the switch at 0 until his look, then deleted — §7 P8): the quads shown by the distance (65 %)
and their size curve; the yaw carousel; the tap on a quad; the tap on empty space (align / roll); the second finger's tap on empty space (the yellow quad)
and on a placed part (the gizmo); ALT / CTRL as the held second touch; Scene_2's pick never nearer than 1.05 × the quads' distance; the red quad.
`INPUTS_TABLE.md` rows 37 – 44, 66 – 70, 72, 75 – 76.

## 5. The audit (part 4)

* R1 – R10 read against the design: the zone latched at the press (R1); the release snaps (R2); taps routed as before (R3); the step back (R4); the picture
  never reads the offset, and outside the zone no code path changes — the switch at 0 is LIVE's code path (R5), the gate §7 G-B; every threshold a slider
  in mm or degrees (R6); the second finger / A owns the roll (R7); the step back's queries within what the frame left (R8); no view chosen by a quad (R9);
  the tags written (R10).
* ⚠ Known limits, accepted: the zone is a circle, not the silhouette (a long piece's ends may fall outside it); the stuck check unchanged (D-P14); the
  undo restores no distance.

## 6. Decisions the lead made (for his review)

* **D-P1** — a switch `pieceTurnZone` (default 1); 0 = LIVE `fe917b8`'s inputs, his comparison on the device. The obsolete code stays until his look (P8).
* **D-P2** — the zone a circle on the glass (§4.1): 5 mm margin, 9 mm floor, a third of the short side as cap.
* **D-P3** — the commit (§4.2): the tap slop, or the deadband after the tap time.
* **D-P4** — the turn 2°/mm about the screen's axes through the piece's centre, drawn eased 40 ms.
* **D-P5** — the lit quad = the nearest direction to sit on, 3° hysteresis (his "same rule as current" cannot read a pitch: today's carousel is the camera's yaw).
* **D-P6** — the last selected quad = the direction of the last snap (a drag's release, a face tap, an undo restores it); cleared at a pick, a put down, a
  spawn or respawn.
* **D-P7** — the step back (§4.5): the bounding sphere about the centre, the approach's line, ≤ 12 queries, eased ≤ 0.08 m a frame, back 300 ms after the
  last turn, the rest to the ring's hold; the fallback refuses at the start.
* **D-P8** — the roll (§4.4): twist 1:1, a tap under 10° = one stop; A + dx 2°/mm; snapping to the nearest edge stop.
* **D-P9** — the face tap (§4.6) — his words; the rolls carried as today.
* **D-P10** — the undo (§4.7): ≤ 32 steps, empty space only, one episode.
* **D-P11** — obsolete inputs inert at 1 (§4.8).
* **D-P12** — the camera stays (§4.5 last line); the coasts stop at the commit.
* **D-P13** — one episode per snap, per roll, per face tap, per undo.
* **D-P14** — the stuck check (the red pop-up, the respawn) unchanged: its turns read at the place, not stepped back.

## 7. The packets and their gates

| packet | what | gate | state |
|---|---|---|---|
| P0 | this page, the dossier [`IN14.md`](../../00_CORE/queue_notes/IN14.md), the queue's row | doc_links + doc_budget | ✅ `56e79e09` |
| P1 | `src/input/piece_turn.ts` (engine-free: the zone, the commit, the turn, the lit quad, the twist, the roll's stop, the step back's searches, the history) + vectors red first + the sliders | verify | ✅ `42e6c6c6` |
| P2 | the zone's drag, the snap, the quads at any distance (`render/piece_turn_wiring.ts`, hooks in `pointer_wiring.ts`, `orient_cube.ts`) | verify + a headless probe | ✅ `42e6c6c6`, probe `f9051b9e` |
| P3 | the step back (the offset in `ringAnchorAt` and the anchor) | verify + probe close in | ✅ same |
| P4 | the roll: the twist, the second finger's tap, A + dx, A + click | verify + probe | ✅ same |
| P5 | the face tap onto the last selected quad; the double tap undo; the empty tap inert | verify + probe | ✅ same |
| P6 | Scene_2 (the pick at any distance, the flow ignoring the zone's pointers, no zone in the idle blend); the obsolete inputs gated; `INPUTS_TABLE.md`, `TUNING_MENU.md`, `PROVENANCE.md` | verify + probe Scene_2 | ✅ same + docs |
| P7 | the gates: G-A verify; G-B the switch at 0 bit for bit against `9dacca36`; G-C the probes; an independent review; then DEPLOY; the docs as built | all green | ✅ §8.2 |
| P8 | ⏳ after his look: the obsolete code deleted (the switch removed) | his look | owed |

## 8. As built (2026-11-25 night)

### 8.1 Where each rule lives
* **`src/input/piece_turn.ts`** — engine-free: `zoneRadiusPx`, `inZone`, `sphereRadiusOnGlassPx` (§4.1); `zoneCommitted` (§4.2); `trackballTurn`,
  `litDirection` (§4.3); `twistAngle`, `twistIsTap`, `nearestAngle` (§4.4); `traceStep` (one step of sphere tracing a frame), `advanceAlong`
  (conservative advancement), `pivotOffset`, `boundingSphereOf` (§4.5); `TurnHistory` (§4.7). Vectors: `tests/piece_turn.test.ts` (27, red before
  the module existed).
* **`src/render/piece_turn_wiring.ts`** — the gesture in flight (`st.pieceTurn`): `pieceZonePointer` (called before the router in `pointer_wiring.ts`:
  a first press in the zone noted, not consumed; its moves and committed release the zone's; a second finger owned), `pieceZoneKey` (A),
  `pieceZoneFaceTap`, `pieceZoneUndo`, `pieceZoneEmptyTap`; the frame's `pieceTurnPre` (the offset the solve reads), `pieceTurnPost` (the drawn
  turn's 40 ms ease, the lit quad, the way out's step, TURNING → BACK, the way back's checked steps), `pieceTurnPlace` (the mesh about its centre).
* **The phases**: IDLE → (a turn asked) OUT → (the sphere free) TURNING → (no gesture, no turn playing, 300 ms) BACK → IDLE. A turn asked during
  OUT waits (`restAlignFrame`); a refusal (no room on the line, or 1.5 s) puts back what changed and the undo's history, and goes BACK.
* **Hooks** (each behind the switch): `ringAnchorAt` = `ringAnchorRaw` + the offset; the drawn anchor + the offset (the picture's `pp` without it);
  the blocker checks of `alignRestingFace` / `rollRestingFace` off at 1; `orient_cube.ts` (the quads by the gesture, full size, faded; no quad tap,
  no red-quad check); `hold_wiring.ts` (the second finger's taps off); `scene.ts` (ALT / CTRL off); `model_bodies_wiring.ts` (the zone's second
  finger never a tap of the flow; `st.modelIdle`; the pick at the part's own distance). Seven sliders: INPUT › PIECE ZONE.

### 8.2 The gates
* **G-A** `npm run verify`: 210 files pass (the new 27 vectors; 10 source pins moved to the new text, each dated).
* **G-B** the switch at 0 against `9dacca36`, `replay_batch.sh` (2 794 frames a scene): `Scene_1`, `Scene_0bis` identical in every frame; `Scene_0`
  under 1e-9 from frame 3 (its known run-to-run noise; 1e-6 never). At 1 the replays run without error and leave the base where the seeded script
  first presses on the piece (`Scene_1`, `Scene_0`: frame 59, its first drag) or taps empty space (`Scene_0bis`: frame 144) — as designed; the steps a
  frame as the base's. ⭐ Re-run after the review's fixes (`6ffcc93e`): all three scenes identical in every frame.
* **G-C** `scripts/probes/zone_batch.sh` (`zone_probe.mjs`, `Scene_1`): the zone's drag turns the piece, the quads up, **the camera still (4e-7 m)**,
  the release snaps onto a direction (0.000°), one undo step, the quads faded; a single tap on empty space nothing, the double click undoes; A + drag
  rolls about the resting normal to one stop, A + click one stop; the face tap rests the tapped face on a direction; the touch twist after a zone start
  rolls one stop; close in the piece steps out as far as its sphere needs (2 – 36 mm in the runs), turns, comes back, **never closer to a part than
  it started**; the solver's anchor equals the drawn one at rest (0.00 mm). `Scene_2`: `pick_probe.mjs` all pass; `seat_probe.mjs` as at 0.
* **G-E** an independent read of the code (a reviewer agent, the code only, no conclusion given): eight findings, all confirmed and FIXED (`6ffcc93e`) —
  (1) a lost release (the window lost; a mouse moving with no button) left the gesture alive: now it ends as a release would (`pieceZoneForget`);
  (2) a refused turn read its offset from the refused pose and face: now from the pose put back; (3) a snap or a roll's start while stepping out wrote
  the turned pose before the room was made: nothing is drawn (nor solved) turned during OUT; (4) the second finger's lift acted after a refusal;
  (5, 6) a release the zone takes moved the gizmo or counted as a tap of `Scene_2`'s flow (`pieceZoneTakesRelease`); (7) the piece held still while an
  orbit started within 300 ms: the way back in now starts at once on another press; (8) the undo's history repaired by truncation; the way out's
  queries exact; a roll with nothing to snap to goes back to its base. The probe gained two checks (a blur mid-drag, then the orbit; `Scene_2`: a part
  picked and turned in the zone): all pass.
* **G-D** his look on the device — owed.

### 8.3 Known limits (for his look)
* The zone is a circle (the piece's bounding sphere on the glass, capped at a third of the short side): close in the piece fills more than that;
  outside the circle a drag orbits.
* The step back moves the piece toward the camera (the camera stays): a long step makes it look bigger for the turn.
* The stuck check and the red pop-up are unchanged (D-P14).
