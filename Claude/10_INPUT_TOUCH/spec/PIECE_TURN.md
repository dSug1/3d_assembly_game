# PIECE_TURN — the piece zone: the piece turned by a drag on it, the step back to turn, the roll, the face tap, the undo (`IN14`)

> **STATUS** · 🔧 **BUILT 2026-11-25 night** (his word: *"proceed as you recommended (md files, packets) … Do not stop until you finish all the
> packets … Deploy at the end so I can test"*) on `1.0.159-Orbit_of_piece`, under the switch **`pieceTurnZone`** (1 = this page, the default; 0 = the
> inputs as on LIVE `fe917b8`). Gated headless (§8.2). ⇢ 2026-11-26 his look on the device: *"Deploy. Looks good on device"* (LIVE `d40e48c`). The packets: §7; as built: §8.
> ⭐ 2026-11-26: the piece orbit's gains (x, y) on the scene orbit's, 2.00 each; the piece roll's gain, 8; the roll with no snap at its start, the
> turn going on after it; a press held still on the piece shows the quads after 300 ms (§9, §9.2, §9.3).
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
  ⇢ 2026-11-26 (his word, §9.2): until the SECOND lifts (or A) — then the first drives the turn again; one driver at a time, still never a blend.
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
the step back's room is asked (§4.5), the quads show. ⇢ 2026-11-26 a press HELD still in the zone shows them too, from 300 ms (§9.3).

### 4.3 The turn under the finger, the lit quad, the snap
* dx turns the piece about the screen's vertical, dy about its horizontal — the scene orbit's degrees per mm × **`pieceTurnGainX`** / **`pieceTurnGainY`**
  (§9; 2.00 each: 10.2°/mm at the shipped gains) of finger travel since the press, about the
  piece's CENTRE; drawn eased over 40 ms toward the finger's.
* **The lit quad**: of the level's distinct directions (the quads' — `orientationFrames`), the one the resting face's normal is nearest to sitting against
  (anti-parallel); another takes over only when nearer by **`pieceTurnLitHysteresisDeg`** (3°). Its quad edged yellow; the quads and the resting face's
  contour at full size, at any distance.
* **The release**: the snap onto the lit direction — today's alignment (the least turn, then the long axes paired, `restAlignToFace`), eased 125 ms, about
  the centre; the quads held 300 ms then faded over 250 ms. The lit direction becomes **the last selected quad**.

### 4.4 The roll
* **Tablet** — the first finger STARTED in the zone (wherever it is now, his first modification); a second finger lands: ⇢ 2026-11-26 NOTHING snaps (§9.2, the free
  roll), the TWIST of the two fingers (the angle of the line between them) rolls the piece about its resting face's normal, × **`pieceRollGain`** (8, §9.2), clockwise on the glass =
  clockwise as seen; at the second finger's lift (or the first's) the roll snaps (from a turn: onto the lit quad first, §9.2) to the nearest edge stop (`nextCoupleRoll`'s couples: 90° the green
  piece, 60° the turquoise). A second finger's TAP (tap rules, under 10° of the FINGERS' twist) = one stop clockwise. While the first stays down, more second-finger
  contacts roll again; ⇢ 2026-11-26 once the second lifts, its own moves TURN the piece again until it lifts (§9.2, R7 amended).
* **Desktop** — A held at a press in the zone, or pressed ANY TIME during a zone drag (his third modification): nothing snaps (§9.2, D-P18), **dx**
  rolls (**`pieceRollDegPerMm`** 2°/mm × `pieceRollGain` 8 = 16°/mm, right = clockwise), snapping at the button's release or A's (A's: the drag
  then turns again, D-P22); a click in the zone with A held (no drag) = one
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
* **D-P4** — the turn 2°/mm about the screen's axes through the piece's centre, drawn eased 40 ms. ⇢ 2026-11-26 his gains on the scene orbit's (§9).
* **D-P5** — the lit quad = the nearest direction to sit on, 3° hysteresis (his "same rule as current" cannot read a pitch: today's carousel is the camera's yaw).
* **D-P6** — the last selected quad = the direction of the last snap (a drag's release, a face tap, an undo restores it); cleared at a pick, a put down, a
  spawn or respawn.
* **D-P7** — the step back (§4.5): the bounding sphere about the centre, the approach's line, ≤ 12 queries, eased ≤ 0.08 m a frame, back 300 ms after the
  last turn, the rest to the ring's hold; the fallback refuses at the start.
* **D-P8** — the roll (§4.4): twist 1:1, a tap under 10° = one stop; A + dx 2°/mm; snapping to the nearest edge stop. ⇢ 2026-11-26 × his roll gain (§9).
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
| P8 | ⏳ after his look (given 2026-11-26): the obsolete code deleted (the switch removed) | his word | owed |

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

## 9. The piece orbit's gains (2026-11-26)

His words: *"I want to be able to manually change the gain of the piece orbit vs the input, this gain being proportional to the gain which already exist
for the scene orbit. Therefore, make slider piece orbit gains such as : piece orbit speed = scene orbit gains (x, y) * piece orbit gains (x, y) * inputs
(x,y)"* — then *"then deploy"*.

* **The rule**, per axis of the glass: the turn's degrees = the scene orbit's degrees per mm × the piece orbit's gain × the finger's mm — x:
  `sceneX × pieceTurnGainX × dx`, y: `sceneY × pieceTurnGainY × dy`. The trackball (§4.3) turns about the axis ⟂ that scaled travel, by its length.
  `pieceTurnDegPerMm` deleted (one gain, one place). Engine-free: `sceneOrbitDegPerMm`, `pieceTurnDegrees` (`src/input/piece_turn.ts`).
* **The scene orbit's degrees per mm**: x = `gainOrbitYaw` × `boxGainYaw` (0.054 rad/mm × 1.65 = **5.1°/mm** shipped). y — ⚠ **a finding**: on the
  orbit around the assembly, the only place the zone runs, a mm of dy turns the camera as many degrees as a mm of dx (`pointer_wiring.ts`, `dvWant`):
  `gainOrbitElevation` and `boxGainPitch` do not act there. So sceneY = sceneX; the piece's own y gain makes the difference.
* **D-P15** — the close-in gain (`closeInGain`) not carried: a distance law of the orbit, not a gain a slider sets; close in the piece steps back to turn.
* **D-P16** — the defaults `pieceTurnGainX` = `pieceTurnGainY` = 0.4 (2.04°/mm at the shipped gains; 2°/mm before, D-P4); sliders 0.05 – 2 (INPUT ›
  PIECE ZONE). ⇢ **his word, the same day** (below): **2.00** each (**10.2°/mm**), sliders 0.05 – **5**.
* The roll's gain (`pieceRollDegPerMm`, A + dx) unchanged — not the orbit. ⇢ his word, the same day: a roll gain (below).
* **As built and gated (2026-11-26)**: 5 vectors red first (`tests/piece_turn.test.ts`), the menu's count 153; `npm run verify` 210 files, 2639 vectors;
  `zone_batch.sh` on `Scene_1` all pass; at both gains 0.8 the same drag turns the piece twice as far (66.7° → 133.6°). The switch at 0 untouched
  (the gains read only in the zone's turn).

### 9.1 The defaults moved, the roll's gain (2026-11-26, his word)

His words: *"This is all good. Set the two sliders default to 2.00. Increase their range up to 5.00. Also, add a slider for piece roll gain and set it by
  default to three times the current setup. Then update the md files. Deploy"*.

* `pieceTurnGainX` = `pieceTurnGainY` = **2.00** (× 5.1°/mm = **10.2°/mm** each, five times D-P16's); sliders and validation **0.05 – 5.00**.
* **`pieceRollGain`** (INPUT › PIECE ZONE, 0.1 – 10), default **3** — the roll = the gain × the input's own angle, for BOTH roll inputs (the current
  setup being the twist 1:1 and A + dx 2°/mm): the twist **3:1**, A + dx 2°/mm × 3 = **6°/mm**; `pieceRollDegPerMm` kept as A + dx's base (its slider
  too). Engine-free: `pieceRollAngle` (`src/input/piece_turn.ts`).
* **D-P17** — the second finger's TAP stays read on the FINGERS' twist (under 10°), never on the gained roll (at 3 the tap would shrink to 3.3°);
  the one-stop rolls (a tap, A + a click) are stops, not gained.
* **As built and gated (2026-11-26)**: 5 vectors red first (two D-P16 vectors moved to his 2.00 / 5.00, three for the roll's gain), the menu's count
  154; `npm run verify` 210 files, 2642 vectors; `zone_batch.sh` all pass on `Scene_1` and on `Scene_2` (`ONLY=s2`, index 3) — the twist's roll
  measured 60.00° for 20° of the fingers at the gain 3. ⚠ The probe's own drags were sized for 2°/mm: at 10.2°/mm its far drag turned ~330°, back onto
  the start's direction (no history step, D-P13) — the probe now sizes its far drag by the turn's gains and its roll inputs by the roll's gain.

### 9.2 The roll with no snap at its start, the turn going on after it; the roll's gain 8 (2026-11-26, his word)

His words: *"When i tap the second finger during orbit of the piece, the piece immediately snaps to an aligned roll before rolling further with the input:
  i don't want this snap but i want a roll based on accumulated input"*; then *"Set the piece roll gain to default 8.00"*; then *"Also, during piece orbit mode, when the second finger is released while the first finger is still pressed, the roll shall snap to alignment and
  the piece orbit shall continue with the first finger input until it is released (currently, the second finger release stops the piece orbit)"*.

* **The root**: the second finger's landing (and A pressed during a drag) ran the turn's RELEASE snap (`snapTurn`: the face onto the lit quad, the long
  axes paired), then rolled from that stop — a snap in the middle of the gesture; and its lift left the first finger inert (R7). This replaces his
  earlier *"the turn snaps and then the twist"* (§0, his first modification) on his word.
* **The free roll**: a second finger landing on a turn under way (or A pressed during it) snaps NOTHING. The roll starts from the pose the turn has (the
  drawn one; the one asked while the piece still steps out), about its resting face's normal, by the ACCUMULATED input × `pieceRollGain` (the fingers'
  twist since the second landed; A + dx's mm since A). The lit quad holds: a roll about the face's normal never moves the normal.
* **The second finger's lift, the first still down**: the roll snaps — the resting face onto the lit quad, then the edge stop (`nextCoupleRoll`'s
  couples, both ways round) NEAREST the pose asked — and the first finger TURNS the piece again from there, until it lifts (R7 amended). Its lift: the
  turn's snap (§4.3).
* **D-P18** — the desktop's A pressed during a drag: the same free roll (the mirror of the second finger, `INPUTS_TABLE.md` §0).
* **D-P19** — a second finger's TAP during a turn (D-P17): at its lift the turn snaps, then one stop clockwise, as before — a stop needs a snapped pose;
  the landing itself snaps nothing; the first finger then turns again.
* **D-P20** — a roll that starts from a stop (the first finger not yet committed, A held at the press) starts from that stop, as before (`snapRoll`).
* **D-P21** — every snap after a roll in the same gesture KEEPS the roll: the stop nearest the pose asked (⛔ the alignment's long-axes pairing alone
  would undo a 90° roll of the green piece). Engine-free: `nearestRollStop` (`src/input/piece_turn.ts`). A turn with no roll in its gesture snaps as
  before (§4.3, the long axes paired).
* **D-P22** — A released while the button is still down: the same as the second finger's lift (the roll snaps, the drag turns again).
* **D-P23** — ONE undo step per gesture (press to release), however many rolls and turns inside (the commit's snapshot; none if it ends where it
  began); an episode per snap (D-P13).
* **`pieceRollGain`** default **8** (his word; 3 in §9.1): the twist **8:1**, A + dx 2°/mm × 8 = **16°/mm**; range 0.1 – 10 unchanged.
* **As built and gated (2026-11-26)**: `piece_turn_wiring.ts` — `snapOnto` (the one snap, `snapTurn` and the free roll's end through it),
  `keepNearestStop`, `endRoll`, `turnOn` (the mode `INERT` deleted), `secondDown` / `pieceZoneKey` (the roll from `turnPoseNow`), `secondUp`
  (`oneStopInGesture`). 6 vectors red first (`nearestRollStop` × 5, the gain's default); `npm run verify` 210 files, 2647 vectors; `zone_batch.sh`
  all pass on `Scene_1` (the new `turnroll`: 0.000° at the landing and at A, the twist's roll 60.00° at the gain 8, one history step a gesture) and
  `Scene_2`; `turnroll` and the twist's new check shown red on the old code (9 FAIL). ⚠ The probe's second-finger lift was a `touchMove` without it,
  which lifts NOTHING in Chrome — the lift had never been tested; now a `touchEnd` naming the point (measured). ⚠ The roll count (`restRoll.rolls`,
  what a face tap carries) after a snap that keeps the roll is counted from that snap's own long-axes pairing — a 90° roll on a face whose pairing
  ties may read −1 where the old count read +1.

### 9.3 The quads shown by a press held on the piece (2026-11-26, his word)

His word: *"modify so that a press or left click held on the piece shows the quads after the same timer as when the quads fade away (currently, only drag on
  the piece shows the quads). update the md files. deploy"*.

* **The root**: the quads came with the COMMIT (§4.2) — a move past the slop, or past the deadband after the tap's time. A press held STILL never
  commits (no move), so it showed nothing.
* **The rule**: a press (a finger, the left button; A held or not) in the zone, held past **300 ms** without its commit, shows the quads — the lit one the
  direction the resting face sits on. 300 ms is the quads' hold after a snap before they fade (§4.3): ONE constant (`HOLD_MS`,
  `render/piece_turn_wiring.ts`), read for both. Nothing turns, no history step, no step back: the press is still not committed.
* **D-P24** — shown at once at 300 ms (no fade in), at full size and at any distance, as during a drag.
* **D-P25** — its release: held 300 ms, then faded over 250 ms, as after a snap. A release before 300 ms shows nothing (a tap stays a tap: the face
  tap's own flash, §4.6). A drag after the hold commits as before — the quads stay up.
* Engine-free: `zoneQuadsShare` (`src/input/piece_turn.ts`) — 1 while a committed gesture lives, while a press is held past the hold, and until the
  hold's end after either; then faded.
* **As built and gated (2026-11-26)**: `pressHeldShows`, `zoneQuadsShare` (`src/input/piece_turn.ts`); `piece_turn_wiring.ts` — `pieceTurnQuadsShare`
  reads the uncommitted press's time, `heldPressEnds` (the release, a lost release). 3 vectors red first; `npm run verify` 210 files, 2650 vectors;
  `zone_batch.sh` all pass on `Scene_1` (the new `held`, touch and mouse: none at 150 ms, shown at 450 ms, the pose kept to 1e-5, held at the
  release, gone by 820 ms, no history step) and `Scene_2`; `held` shown red on the old wiring (4 FAIL).
