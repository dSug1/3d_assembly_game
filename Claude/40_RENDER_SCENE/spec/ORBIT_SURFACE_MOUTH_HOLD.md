# THE MOUTH'S HOLD RESTRICTED — the build list's item 2 (package S3, designed 2026-11-23)

> **STATUS** · ⭐ **DESIGNED 2026-11-23** on his word *"Keep as held. Continue build"* (the build list's next item, `ORBIT_SURFACE.md` §6 (2)) — the
> rule decided 2026-11-16 (Q4, his answer (a)); nothing here asks him a new question: the choices the rule leaves open are made in §9 and may be
> reversed on his look. ⭐ **BUILT AND GATED 2026-11-23 (`d4b6c222` + the audit's follow-up, §10)**: G0 green; G1 his four records IDENTICAL to `3b7a479`;
> G2 measured (§7: one FINDING for his look); the audit: no defect. ⭐ **DEPLOYED 2026-11-23** on his word *"Deploy"* (LIVE main `e80a7b0` = `1bc13f70`); his look OWED. Branch `1.0.158from1.0.157-Orbit_surface`, worktree `../orbit_surface`.
> **OWNS** · S3: where the mouth's hold acts (its domain), its switch, its vectors and gates. ⛔ Not the hold itself (his S10, `mouthHold`), not the
> tilt it hands over to, not the camera — the orbit is closed (`ORBIT_SURFACE_BUILD.md` §9).
> **READ WITH** · [ORBIT_SURFACE.md](ORBIT_SURFACE.md) §2.4 (S18: where the hold comes from), §8 Q4; [ORBIT_SURFACE_AUDIT.md](ORBIT_SURFACE_AUDIT.md) §5.2
> (Q4 as asked); [ORBIT_SURFACE_SHAPES.md](ORBIT_SURFACE_SHAPES.md) F5 (the hold measured on the study's shapes); [ORBIT_SURFACE_READOUT.md](ORBIT_SURFACE_READOUT.md)
> (P2 at the gizmo's place, the readout this reads). Code read on `d57dee5b`.

## 1. In one paragraph

Today a dy toward a void's open end HOLDS the gizmo at its last place before the void (`mouthHold`) — his *"build b"* (2026-11-10) for `Scene_1`'s
top channel seen from the front: *"the tilt shall happen when the red section reaches the edge at the bottom of the mouth"*. Its trigger (a void on
the facet's plane closed across, open up the facet, with no floor — `stackDepthAt`'s `mouth`) is wider than its purpose: the study (F5) found it
holding the gizmo ON THE TOP CAP, along gaps between islands, in a V, for up to 479 mm of a dy. His decision Q4 (a) restricts it to its purpose —
where it hands over to the automatic tilt: **never on a cap (H1)**, and **only over a void P2 leaves open for the held piece (H2)**. S3 builds the two
as one domain test in front of the hold, behind the switch `mouthHoldDomain` (0 = `3b7a479`'s hold frame for frame).

## 2. His words

* **Q4** (2026-11-16, `ORBIT_SURFACE.md` §8): *"The mouth's hold (the gizmo's side of S10) restricted?"* → **(a)**: *"never on a cap — now; over a void
  P2 leaves open for the held piece — once the landing map exists"*. As asked (`ORBIT_SURFACE_AUDIT.md`, the Q table): *"Restrict it to where it hands
  over to the automatic tilt (a side facet, toward a cap's edge)"*. His condition on every accepted recommendation: *"they shall be later tested and
  could be reversed if the testing shows they need to be reversed"*.
* **S10** (2026-11-10): *"the tilt shall happen when the red section reaches the edge at the bottom of the mouth, therefore the green section should not
  be an issue"* → *"build b"*. Kept: S3 changes where the hold acts, never what it does.
* **2026-11-23:** *"Keep as held. Continue build"* — P2 reads the piece AS HELD (`ORBIT_SURFACE_READOUT.md` §14), so H2 asks P2 about the piece as the
  player holds it.

## 3. The hold as built (`d57dee5b`)

* **The trigger** — `stackDepthAt` (`input/face_map.ts:979-984`): on the facet's plane, no real face under the place, the plane's faces on both sides
  ACROSS it (`closedAlong`: `c.x`) and not along it, and no deeper group under it (no floor): `bridged` with `mouth: { lo, hi }` — the end(s) of the
  facet's `b` the void opens toward. `rawGizmo` passes it on (the place on the plane, `host` null) unless a cast finds a part in front of the plane.
* **The hold** — `mouthHold(wasHeld, mouth, dP, dY)` (`input/orbit_tilt.ts:330`), once a frame in `assemblyFrame` (`render/assembly_wiring.ts:1411`):
  a step whose pitch dominates toward an open end holds; a dx lets go; no step keeps the state. Held: `asmMouth` = the last place shown before the
  mouth; the gizmo shown there, no glide; let go: from the held place straight.
* **The hand-over** — close in, `tiltOn(st, asmMouth.hi)` (`:1351`): the tilt onto the face holding the pole the mouth opens toward (`wm.top` /
  `wm.bottom`); `poleCrossingDue` waits while held (`mouth`).
* **What F5 measured** (the study's emulation, a dy as a travel along `b`): the designed case held as labelled (Q02: 28 mm under the lip); 32 sweep
  cells held a dy ON THE TOP CAP for up to 479 mm; path-dependent places L10 844, L11 844, L48 718, L50 698, L27 482, L24 378, Q02 56, L29 46; a
  channel closed far behind (L07) has no mouth (its back wall counts as a floor).

## 4. The rule

* **H1 — never on a cap.** The hold acts only where the frame's place is on a SIDE band (`MapTarget.band === "SIDE"`, in the map's own frame: the
  world's, a tilted pole's, a zone's). On a `TOP` / `BOTTOM` band a mouth is no mouth: no hold begins, a held gizmo is let go (as a dx lets it go —
  from the held place straight). On a side band the hold's two ends (`b`'s) run toward the faces holding the poles: *toward a cap's edge* by
  construction of the side facets' frames (⚠ a side whose `b` end meets a set-back side, not the cap: not studied — §8).
* **H2 — only over a void P2 leaves open for the held piece.** At the frame's place, P2 (the held piece AS HELD, moved along the facet's normal —
  `readoutAt` on the facet's preparation, `ORBIT_SURFACE_READOUT.md` §4) says whether the piece enters the void:
  * **open** — P2 reads **nothing** (the piece passes right through: `Scene_1`'s channel, through, C49), or P2 **lands deeper than the piece would
    rest on the facet's plane**: Δ < *s* − `SURFACE_STEP_MIN_MM`, where Δ is P2's level less today's (at a mouth today's point IS the plane's: the
    bridge) and *s* the held piece's reach toward the facet (max over its points of −p·n: where its reference stands when it rests on the plane — on a
    side facet half the piece, his "as held");
  * **closed** — otherwise (the piece rests on the rims: the void is no void for it): no hold.
  * **unread** — no P2 at the place (a scene other than the readout's, `Scene_1` — the readout's D1: on `Scene_2` `placedParts` hulls whole meshes,
    not the `UCX_` pieces; no held piece; the piece refused): H2 does not restrict — the hold as H1 leaves it (§9 D2).
  * The constant: **`SURFACE_STEP_MIN_MM` = 0.5** in `src/core/units.ts` — Q6's ruler, *"a step ≥ 0.5 mm a wall in contact range"*, its first use.
* **One owner.** The domain is a pure function (`mouthHoldDomain`, `input/orbit_tilt.ts`) read by the wiring right before `mouthHold`: outside the
  domain the mouth is passed as `null` — the hold's own rule (*"no mouth, no hold"*) lets go. Nothing after the hold undoes it; nothing else changes.

## 5. Where P2 comes from (the readout's evaluation shared)

The readout (S2) already evaluates P2 once a frame at the frame's own gizmo (`landingReadoutFrame`, right before the hold), on `Scene_1`, cached per
facet. S3 splits it in two: **the evaluation** (the preparation per facet, `readoutAt` at the place — the state `st.landing`) runs when EITHER switch
needs it (`landingReadout` 1, or `mouthHoldDomain` 2 at a mouth); **the display** (the ring, the HUD line) only at `landingReadout` 1. ⛔ The readout's
rule *"nothing reads it back"* is lifted for ONE reader, the hold's domain, by name; the sections, the blend, the solver, the calm, the camera still
never read it. The cost: none where no mouth is met; at a mouth the facet's preparation once (2.5 – 6.6 ms on this PC, `ORBIT_SURFACE_READOUT.md` §14
G2), then ~3 µs a frame.

## 6. The switch

`mouthHoldDomain` (GIZMO & SECTIONS): **0** — the hold as built (`3b7a479` frame for frame); **1** — H1 alone; **2** — H1 + H2 (**the default**).
1 lets his look tell the two apart.

## 7. What it changes on the glass — measured before the build (`d57dee5b`)

* **His four records of 2026-11-22** (`Scene_1` back / front, `Scene_0bis` back / front — 22 342 frames, replayed headless with the hold recorded each
  frame: the kit's `fo3/surface/mouth/run_mh.sh M0`, `rd_mh.mjs`): **the hold NEVER fires** — not one frame held, on a side or a cap. Nothing he has
  played changes; the change shows only where he has not been.
* **`Scene_1`'s face map scanned** (`scripts/surface/mouth_scan.ts`: every 2 mm over each facet, `stackDepthAt` as the game calls it, the green piece's
  box 41.3 × 48 × 45 mm as held; the 36 placed boxes, ⚠ the four seated frusta left out): **no mouth on a cap** (H1 changes nothing on `Scene_1`); on
  each of the front and the back (n ±z) **1090 mouth cells in two voids**:
  * **the top channel seen from its end** (126 mm wide, its 28 mm band under the top edge, open UP — the designed case of S10): P2 **open** on 660 of
    945 cells (the piece passes right through), **closed on 285** — the places within half the piece (20.65 mm) of the channel's two walls, where the
    piece, centred there, would strike a wall;
  * **a 10 mm slot near the bottom** (56 mm tall, open DOWN toward the bottom edge): P2 **closed on all 145 cells** (the 41.3 mm piece never enters it)
    — a hold that fired where no piece can go: F5's misfire on `Scene_1`, removed by H2.
* ⚠ **A FINDING FOR HIS LOOK (H2 before P2 drives).** Near the channel's walls H2 lets the gizmo go: it climbs the plane's bridge to the real top edge
  (the piece cannot pass there — P2 is right), and on the top TODAY's depth rule — not P2's yet — puts it on the channel's floor (`stackDepthAt`'s
  `pieceEnters`: the opening against the piece's two smallest sizes, not where the piece stands), 21 mm lower: the drop at the tilt that *"build b"*
  removed (2026-11-10), back on 30 % of the channel's width (eased by the depth's glide). The root is the top's depth, not the hold: once P2 drives
  the gizmo (the build list's item 4) the top reads the rims there too and the two agree. → his word: keep 2 and build item 4 next (⭐ recommended),
  or `mouthHoldDomain` 1 by default until item 4 (on `Scene_1` 1 = the hold as built: no cap mouth there).

## 8. Vectors and gates

* **V1** `mouthHoldDomain` (pure): a side band open → the mouth kept; a cap (TOP, BOTTOM) → null, whatever P2; closed → null; unread → kept; the switch
  at 0 → kept everywhere; at 1 → P2 ignored. Each red on its mutant first (the band test removed; open and closed swapped; the reach *s* left out —
  every side facet then reads closed; unread treated as closed).
* **V2** the wiring: the domain read right before `mouthHold` with the frame's own readout (the source pin of `orbit_tilt.test.ts` amended); at 0 the
  readout's evaluation is not run for the hold (V4's rule kept: at `landingReadout` 0 and `mouthHoldDomain` 0 nothing is prepared).
* **G0** `npm run verify`. **G1** his four records replayed at `mouthHoldDomain` 0: identical to `3b7a479`'s replays (`cmp_id.mjs`, largest difference
  0); at 2: every frame that differs is one the hold held on a cap or over a closed void in M0 (or follows from one), none else. **G2** offline, the
  study's emulation (F5) with the domain: the cap's held cells and the path-dependent places, before / after. **His look** (rule 5).
* ⚠ **Not studied:** a side whose `b` end meets a set-back side rather than the cap (H1 holds there; the hand-over then tilts onto the map's cap);
  a mouth at a pole (C41, Q02 — the cap: H1 removes it).
* ⚠ **G2 as run** (the audit's finding 1): not the study's F5 emulation re-run but `Scene_1`'s scan (§7). F5's cap cells (32, up to 479 mm) are removed by
  H1 BY CONSTRUCTION (V1: no mouth on a TOP / BOTTOM band at 1 or 2); the study's side cases (Q02's designed mouth, its path-dependent places) were NOT
  re-run with H2 — owed if his look asks for it.
* ⚠ **Known limits** (the audit, 2026-11-23): (L1) today's level at a mouth is the frontmost group within `MAP_COPLANAR_M` (0.5 mm) of the plane, not
  the plane itself — two near-coplanar planes up to 1 mm apart can read a closed void OPEN (Δ = reach − 1 mm); never the other way; not on `Scene_1`'s
  aligned boxes. (L2) where P2 changes along `b` inside one mouth (a void narrowing up the facet, a back wall changing), a pure dy can leave the domain
  and come back: the hold lets go (the dx's release: the gizmo to the place moved on) and restarts from the last place shown — in steps; not on
  `Scene_1`'s channel (P2 the same along `b` there: the piece stands up from the place). (L3) H1 reads the MAP's frame: under a tilt the world's top is a
  side of the tilted frame, so a mouth there is judged by H2 alone (by design: §4).

## 9. Decisions made in the design (2026-11-23 — on his "continue build"; reversible on his look)

* **D1** — H2's *open* is P2 reading nothing or entering deeper than the piece rests on the plane by Q6's 0.5 mm; the reach *s* is read from the held
  piece as held (his word of today), so a side facet's half-a-piece stand-off is not mistaken for a closed void.
* **D2** — where P2 is not read (outside `Scene_1`, no piece, refused), H2 does not restrict: his S10 stands where it cannot be judged.
* **D3** — one switch with three values (0 as built, 1 H1, 2 H1 + H2, default 2) rather than two switches: one owner of the domain.
* **D4** — the readout's evaluation shared, its display separate (§5); its *nothing reads it back* lifted for the hold's domain alone.

* **D5** — the default 2 (his Q4 as decided) despite §7's finding: the finding is H2's consequence while the top's depth is not yet P2's, for his
  look to judge (his own condition: *"could be reversed if the testing shows they need to be reversed"*); 1 stands beside it on the slider.

## 10. As built (`d4b6c222`, 2026-11-23)

* **Files.** `src/input/orbit_tilt.ts` `mouthHoldDomain` (pure); `src/core/landing_map.ts` `heldReach`, `voidOpenFor`; `src/core/units.ts`
  `SURFACE_STEP_MIN_MM` (0.5 — Q6); `src/render/landing_readout.ts`: `landingReadoutFrame(…, forHold)` (the evaluation asked at a mouth at 2, even at
  `landingReadout` 0), `shown.reach`, `mouthP2` (this frame's readout only); `src/render/assembly_wiring.ts`: the frame's readout asked at a mouth
  (`st.cfg.mouthHoldDomain === 2 && m0g !== null && m0g.mouth !== undefined`), then `mouthIn` — the mouth through the domain — into `mouthHold`;
  `gestureConfig.ts` `mouthHoldDomain` (0 / 1 / 2, default 2, validated); `tuning_menu.ts` GIZMO & SECTIONS (137 sliders). Nothing else reads P2.
* **Vectors** (`tests/mouth_hold_domain.test.ts` V1 – V3; the side-facet vector of his *"Keep as held"* in `landing_readout.test.ts` V2), each shown
  RED on its mutant first — the mutant → the red line:
  | the mutant | red |
  |---|---|
  | H1's band test removed | V1 H1: *"1 TOP open: expected true to be false"* |
  | unread treated as closed | V1 side: *"expected false to be true"* |
  | the switch's 0 not honoured | V1 0: *"SIDE closed: expected false to be true"* |
  | the reach left out of `voidOpenFor` | V1b entering: *"expected false to be true"* |
  | Q6's step left out | V1b entering by 0.4 mm: *"expected true to be false"* |
  | open and closed swapped | V1b, V2: 5 tests |
  | the reach's sign | V1b reach: *"expected 40 to be close to +0"* |
  | the hold's ask ignored (`forHold`) | V2: *"expected 'unread' to be 'open'"* |
  | `mouthP2` not keyed on the frame | V2: *"expected 'closed' to be 'unread'"* |
  | the wiring passing the mouth as built | V3: the source pin |
  | (b) the held piece turned onto the facet (`prepareLanding`) | `landing_readout.test.ts` V2 side facet: *"expected +0 to be 50"* |
* **Pins amended:** `orbit_tilt.test.ts` (the hold's line: `mouthHold(wasHeld, mouthIn, dP, dY)`), `landing_readout_switch.test.ts` (`forHold`; the
  hook's call), `menu_layout.test.ts` (137).
* **G0** `npm run verify`: 191 files / 2359 tests; after the follow-up 2360. **G1** (the kit's `fo3/surface/mouth/run_g1s3.sh`): his four records
  of 2026-11-22 replayed on `d4b6c222` at the DEFAULTS (`mouthHoldDomain` 2, `landingReadout` 1) against the `3b7a479` code's replays
  (`follow/cap/runs_r/L1_*`, `cmp_id.mjs`): **IDENTICAL**, largest difference 0, on 2916 + 6034 + 5011 + 8381 frames; the hold never held (as on
  `d57dee5b`). At 0 the same by construction (the audit's item 1). **G2:** §7 (the scan; §8 *G2 as run*). **His look:** owed.
* **The audit** (independent, read-only, 2026-11-23, on `d4b6c222`): **no defect**. The switch at 0 is the build before (`forHold` false, every mouth
  kept, `mouthHold` null ≡ undefined); the readout the hold reads is this frame's, at the same stack, normal and place (`gizmoOf` carries `mr0`'s `t` and
  `mouth`); the reach and Δ in one frame; at `landingReadout` 0 the ring hidden and the line empty, at most one preparation a frame (a 2.5 – 6.6 ms
  hitch at the first mouth of a facet even with the readout off); a release mid-hold takes the dx's path, the hand-over always from a valid hold. Its
  three risks are §8's *G2 as run* and *Known limits*; its two nits fixed in the follow-up (the threshold pinned from both sides: entering by 0.6 mm is
  OPEN — red on twice Q6's step: *"expected false to be true"*; `mouthP2` pinned to its one caller — red on a second reader in the wiring:
  *"expected 2 to be 1"*; `M_PER_MM` for the step).
* **Lessons → rules** (`SCENE_WORKFLOW.md` §10): nothing for a scene — the misfire at the 10 mm slot was the game's rule (now H2), not the scene's
  drawing; the near-wall finding is the top's depth rule (item 4). No new rule; no ledger row but §7's finding (`ORBIT_SURFACE_BUILD.md` §8 row 11).
