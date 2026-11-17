# Step C5 (one half-turn event) — the four sites as they stood and C5 as built, moved out of the spec (2026-11-17)

Moved WORD FOR WORD from [TILTED_POLE_CLOSE_IN.md](../spec/TILTED_POLE_CLOSE_IN.md) (§13.1 and §13.3) to make room for package R1's record
(§19 there; the topic file at its 800 lines). Nothing here is changed. ⚠ Since R1 (2026-11-17) the spit's change of side is no longer read off the
camera and no longer holds the finger's last dy sign: what is said below of `spitStep`, `crossingHold` and `asmSpitU` is the record of C5, not the
code — §19 there.

## From §13 (step C5)

### 13.1 The four, as they stand (read on `1190db2`)

| | (1) the tilt's exit | (2) the ridge crossed close in | (3) the spit's change of side | (4) a free face's exit |
|---|---|---|---|---|
| the trigger | the place one band past the tilted facet (`tiltFrame` → `exit`, made at the next frame's start) — or the latch off by distance (`off`) | close in, the map's angles at ±90°, the finger asking beyond (`poleCrossingDue`) | the camera's shown direction crossing the vertical plane through the axis, steeply (`crossingPitch` ≥ 60°) — in the CAMERA's stage, read off the camera's place | the place one band past the free face (`freeFaceFrame`) |
| the frame | gravity's (the tilt dropped) | gravity's, unchanged | the zone's, unchanged | the zone's, unchanged |
| the angles | `seamRebase` at the gizmo (the world map's; at its pole the heading shown kept) | `seamRebase` at the far face's (`poleSeam`) | — | — |
| the camera's turn | `seamTurnStart` from the pose shown (by distance: C3's `seamOutStart`), the ease from the direction drawn (`seamEase`) | the same turn written out, `seamEase` | the same turn written out, the ease running carried (`easeCarry`) | the same, `easeCarry` |
| the hold — who | `edgeHoldAt(tl.heading, nT, nW, g, dySign)` (never by distance) | `edgeHoldAt(orbit.yaw, n0, nFar, P, dySign)` | `crossingHold(g, gizmoNormal, axis, side, dySign)` | `exitHoldSign` → `crossingHold(…, held)` |
| its threshold | the face beyond's level normal more than 120° from the heading | the same | none: every crossing | the turn over 90° |
| its sign | the finger's LAST dy sign, whatever crossed | the same | the same | the dy that pushed the gizmo out over that side (D-T4) |
| its side | — (the field `d`, into the face beyond: never read) | the same | the same | the same |
| **dead** | `EdgeHold.g0`, `EdgeHold.d` — written by `edgeHoldAt` and `crossingHold`, read by nothing (the hold reads `sign`, `back`; the play recorder too) | ← | ← | ← |

The hold ends the same way for all four: the finger the other way for `edgeHoldMm` (`edgeHoldFinger`), the gesture's end (`gestureOver`), the
assembly's orbit off; (3) also when the side changes round a tip. The gizmo is held while any of these turns runs (`tiltClampStep`), but C3's paced way out.

### 13.3 As built (2026-11-16, an Opus agent)

* **Pure** (`src/input/free_face.ts`): `crossingHoldSign` (the rule of §13.2, its floor `CROSSING_PUSH_MIN` 1e-9), `faceOwnUp`, `unfoldAcross`,
  `edgeOut`, `crossingEvent` (the turn and the hold); `exitHoldSign` now through `crossingHoldSign` (the same answers on a free face's level sides).
* **ONE wiring function** (`crossTurn`, `assembly_wiring.ts`), called by the four sites under `chartLayout` 1: `tiltOff` (twice: with a place to keep
  and without), `poleCross`, `spitStep`, `freeFaceExit`. What each keeps: `tiltOff` its frame, the calm and the square camera out of F, the paced way
  out's flag (C3); `poleCross` the far face's views (the held heading, the calm, the square camera's target); `spitStep` its side and its trigger;
  `freeFaceExit` the free face's state and the side read afresh (its unused zone argument removed).
* **The hold**: the tilt's exit and the ridge by `crossingEvent` (`T` = `map · y`; the face left's own up); a free face's exit by `exitHoldSign` (as
  built, through the rule); with the switch off `edgeHoldAt` and `crossingHold` as before.
* ⛔ **The spit's change of side keeps §8's hold** (the finger's last dy sign, `crossingHold`), through the one event. The mirror view as its next up
  was built and measured, then WITHDRAWN: arrived along the top ridge from a tip (`ridge_check.mjs`, close in) the picture turns ~110°, not a mirror;
  the dy that had crossed was judged not to push (the gizmo crossed by the tip triangle's fall line, not by the finger's way on the glass), was not
  held, and brought the gizmo straight back over the ridge — a second half turn: the view 124° → 343° in the drag, from both tips. The rule needs the
  up the picture turns TO, which a side read off the camera's place does not give (§13.4).
* **The dead fields**: `EdgeHold.g0` and `.d` deleted; `edgeHoldAt` and `crossingHold` lose their `g0` argument (their `null` cases kept — the switch
  off bit for bit).
* **Vectors**: `tests/crossing_event.test.ts` (13; **2071 vectors**, 163 files); the source pins of seven files moved to the event; red on 11 mutants (the come-back test dropped,
  the push test dropped, the push floor at 0, the unfolding reversed, the outward direction reversed, the own up not laid in the plane, the hold not
  set by the event, the tilt's exit back on `edgeHoldAt`, the rebase skipped, the spit's hold dropped, `exitHoldSign` on the last sign).

**The gates** (against `scripts/probes/ORBIT_GATES.md` §6, the baseline at `276a6c2`):

| gate | result |
|---|---|
| the replays, `chartLayout=0&chartCalm=0` | `Scene_0` identical; `Scene_1`, `Scene_0bis` 2.0e-11 / 2.9e-9 from frame 3 (`1e-6: never`) — the baseline's own noise |
| the replays, the default | the three scenes IDENTICAL in every frame (2794 / 2794): the seeded play never crosses an exit turning 90° – 120°, nor a far edge or a ridge with another dy sign |
| `tilt_check` default, `chartLayout` 0, `out` (1 and 4 px), `ridge`, `press`, `rim`, `pole` | every number equal to the baseline (default 8.7 / 673, 8.8 / 2149, 8.9 / 3627 with 13 holds; the way out 180° at 6.0° a frame; the ridge's holds 54 / 54, 45 / 45, 51 / 51, 36 / 36) |
| `mid_check`, `across_check` (default and off) | equal: the middle reached, 76° / 6.2°; across 241° / 6.6°, the half turn past the far edge, 936 frames held |
| `edge_noise` (top ±2.5 mm, three scenes; side ±10 mm) | equal: the tilt made / left 0, the view 0° |
| `ridge_check` (new), 8 runs | equal to the code before in every run (once the spit's hold was kept) |

**Where the rule changes what the player feels** (vectored; no gate run reaches it): a tilt's exit or the ridge crossed with the finger's last dy
the OTHER way (an edge crossed by a dx with an old dy sign): no hold — before, that old sign was held; an exit turning between 90° and 120° (a free
face that is not a rectangle — none takes a layout yet, D-T5): held for the dy that pushed — before, free.
