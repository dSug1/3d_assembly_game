/**
 * ⭐⭐⭐ prototype — **THE HELD SECOND TOUCH** (`RESTING_FACE_ALIGNMENT.md` §20; the owner, 2026-10-11): the white sphere is deleted; the way
 * in, the orbit around the piece and the way out are made by a HELD SECOND TOUCH (the right button on a desktop), anywhere.
 *
 * - **Roles** — the second touch is the one pressed while another is down (a finger), or the right button (a mouse); it keeps its role
 *   until it lifts. While it is held, the first touch may lift and press again: that CONTINUES the same input (*"While second touch is
 *   held, first touch release and re-press does nothing (i.e. continuation of previous input). Only second touch release finishes the
 *   input"*).
 * - **The pink face** (*"Second touch on any object's face (except the green and turquoise pieces themselves) selects the pink face and aligns
 *   the resting face with the pink face. This does not trigger a change in the center of orbit"*): only a PLACED part's face — ⛔ never a frozen
 *   body (*"frozen bodies (the floor) are never a pink face; a second touch on them counts as empty space: ok"*), never the orbited pieces —
 *   ⭐ taken AT THE PRESS (2026-10-11, *"immediately when left button is pressed. Same for the mobile input"* — it was taken once the press
 *   was known NOT to be a pinch, *"option B"*); the face the piece is already aligned to: nothing (`pinkChanges`).
 * - **The way in** — the second touch held + the first touch's dx past the deadband: decided there (`holdDecision`) — the second touch's own x
 *   travel past HALF the deadband says the two fingers are pinching (ZOOM), else it is the way in (WAY). ⭐ (2026-10-12) no longer latched: the finger that moves decides again (`holdSwitch`).
 * - **The highlights** — the pink face and the resting face shown while the input runs, held `holdMs` after it, then faded over `fadeMs`
 *   (`highlightAlpha`).
 * ⛔ No engine, no scene: millimetres and milliseconds.
 */

export type HoldMode = "HELD" | "WAY" | "ZOOM";

/**
 * ⭐ The first touch's dx past the deadband decides what the two touches are doing: the second's x travel past HALF the deadband — it is on
 * its way, a PINCH (`"ZOOM"`); within it — it is held (its noise was measured at 0.76 mm), the WAY IN (`"WAY"`). Before that: `null`.
 * ⭐ Why half: in a symmetric pinch both fingers cross their deadband about together, and which event lands first is a toss-up — at the
 * first finger's crossing the second has travelled well past half of it.
 */
export function holdDecision(
  firstDxMm: number,
  secondDxMm: number,
  deadbandMm: number,
  /** ⭐ (2026-10-11) how long the second touch has been held, and the tap time: a TAP never starts the way in */
  heldMs = Infinity,
  tapMs = 0,
): "WAY" | "ZOOM" | null {
  // ⭐ (2026-10-11, the owner: *"zoom: make it possible also if first touch is immobile and second touch dx exit deadband"*) — the SECOND
  // touch's dx past its deadband first: a ZOOM at once
  if (Math.abs(secondDxMm) > deadbandMm) return "ZOOM";
  if (!(Math.abs(firstDxMm) > deadbandMm)) return null;
  if (Math.abs(secondDxMm) > deadbandMm / 2) return "ZOOM";
  // ⭐⭐ (2026-10-11, the owner: *"why when I tap CTRL during a dx orbit around the center, the piece jumps and come back?"* → *"build it"*) — a
  // second touch held less than the tap time may still be a TAP (its press's raycast its whole action): no way in yet — the drag goes on
  // orbiting the centre meanwhile (`hold_wiring.ts`); a tap in the middle of a drag no longer makes a way in and a way out at once
  return heldMs < tapMs ? null : "WAY";
}

/**
 * ⭐⭐ (2026-10-11, the owner: *"left click held + CTRL/ALT tap on empty or on the pink face (=first touch held + second touch tap on empty or
 * on the pink face) rolls to the next axis"*) — does the second touch's release ROLL the piece to the next axis? A TAP (`tapped`), that
 * never became the way in or a zoom (`mode` still HELD), while the FIRST touch is held (`firstHeld`), whose press did nothing else
 * (`pressActed` false — ⭐ 2026-10-12: a press on a PLACED part moves the orbit centre instead).
 * ⭐⭐ (2026-10-13, the owner: *"the second touch's tap on empty space to do exactly what the first touch's tap does: align to the yellow quad, or roll if already aligned there"*) — it no longer only ROLLS: it TAPS THE YELLOW QUAD, as the first touch's tap on empty space does
 * (`orientTapShown`: aligned to it, or the roll when already aligned there) — so the piece need not be aligned first (`aligned` dropped;
 * it was `holdTapRolls`).
 * ⛔ (2026-10-12) the pink face from a part and the key's raycast are deleted: no "pink changed", no "over the orbited piece".
 */
export function holdTapTapsYellow(tapped: boolean, mode: HoldMode, firstHeld: boolean, pressActed: boolean): boolean {
  return tapped && mode === "HELD" && firstHeld && !pressActed;
}

/**
 * ⭐ A TRAILING ANCHOR (§1.1's shape, one axis, mm): inside one deadband of the anchor nothing happened; past it the anchor is dragged to one
 * deadband behind `x` and `moved` says so — a travel past the deadband from wherever the finger RESTS, never from where it started.
 */
export function trailAnchor(anchorMm: number, xMm: number, deadbandMm: number): { readonly anchor: number; readonly moved: boolean } {
  const d = xMm - anchorMm;
  if (!(Math.abs(d) > deadbandMm)) return { anchor: anchorMm, moved: false };
  return { anchor: xMm - Math.sign(d) * deadbandMm, moved: true };
}

/**
 * ⭐⭐ (2026-10-12, the owner: *"Can we modify so we can swap from one to another without releasing any of the two touches?"* → *"Build with the
 * 150ms rest. No change for desktop."*) — **ZOOM ↔ WAY IN + ROLL, WITHOUT LIFTING**: once decided, the finger that MOVES decides again —
 * - WAY: the SECOND finger's dx past its deadband (`secondMoved`, from where it rests) → ZOOM;
 * - ZOOM: the second finger at rest for `restMs` (`secondRestMs`) AND the FIRST finger's dx past the deadband since it came to rest
 *   (`firstDxMm`) → WAY.
 * ⚠ Cost, named and chosen: in a zoom, the first finger alone used to zoom too (the pinch reads the fingers' distance); after the rest it
 * rolls instead. A pinch with both fingers moving stays a zoom. ⛔ HELD (undecided) is `holdDecision`'s, never this.
 */
export function holdSwitch(
  mode: HoldMode,
  secondMoved: boolean,
  secondRestMs: number,
  firstDxMm: number,
  deadbandMm: number,
  restMs: number,
): HoldMode {
  if (mode === "WAY") return secondMoved ? "ZOOM" : "WAY";
  if (mode === "ZOOM") return !secondMoved && secondRestMs >= restMs && Math.abs(firstDxMm) > deadbandMm ? "WAY" : "ZOOM";
  return mode;
}

/**
 * ⭐⭐ (2026-10-12, the owner: *"Simplify the zoom so that this reverts back to the standard zoom input design for mobile"*) — the STANDARD PINCH:
 * two fingers down, it starts as soon as EITHER has travelled past the deadband (mm, from its press); then the zoom follows the fingers'
 * distance. ⛔ The way in (`holdDecision`'s WAY) and the switch without lifting (`holdSwitch`) are commented out with the piece orbit.
 */
export function pinchStarts(firstTravelMm: number, secondTravelMm: number, deadbandMm: number): boolean {
  return firstTravelMm > deadbandMm || secondTravelMm > deadbandMm;
}

/**
 * ⛔⛔ (2026-10-13, the owner: *"The possibility to move the gizmo by second touch tap on mobile has disappeared. Reinstate."*) — the second touch's release that is a TAP (`isTapRelease`: within `tapMaxDuration` and the 8 mm
 * `doubleTapSlop`) is a tap even when the fingers' wobble already started the STANDARD PINCH (either finger past the 3.5 mm deadband,
 * `pinchStarts` — since 2026-10-12): a real finger's tap wanders a few mm, so the tap on a placed part (the gizmo moved there) and the tap roll
 * were lost to a zoom. The mode the release is judged in: `HELD` for a tapped `ZOOM` (the caller undoes the zoom it started).
 */
export function holdTapMode(mode: HoldMode, tapped: boolean): HoldMode {
  return tapped && mode === "ZOOM" ? "HELD" : mode;
}
