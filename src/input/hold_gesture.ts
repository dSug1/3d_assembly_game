/**
 * ⭐⭐⭐ prototype — **THE HELD SECOND TOUCH** (`RESTING_FACE_ALIGNMENT.md` §20; the owner, 2026-10-11).
 *
 * - **Roles** — the second touch is the one pressed while another is down (a finger), or the right button (a mouse); it keeps its role
 *   until it lifts. While it is held, the first touch may lift and press again: that CONTINUES the same input (*"While second touch is
 *   held, first touch release and re-press does nothing (i.e. continuation of previous input). Only second touch release finishes the
 *   input"*).
 * - **Two fingers** — their separation latched past the deadband: the APPROACH (2026-11-13, the pinch is the approach).
 * - **A tap** of the second touch — on a placed part, the gizmo moved there; else the yellow quad tapped (`holdTapTapsYellow`).
 * ⛔ (2026-11-14, CL1) the parked way in's decisions (`holdDecision`, `holdSwitch`, `trailAnchor`, the "WAY" mode) deleted — their callers
 * commented out since 2026-10-12 (the code at `7c38150`).
 * ⛔ No engine, no scene: millimetres and milliseconds.
 */

export type HoldMode = "HELD" | "APPROACH"; // ⭐ (2026-10-28) APPROACH: two fingers bring the piece in (around the assembly) — ⛔ (2026-11-13) "ZOOM" deleted with the zoom

/**
 * ⭐⭐ (2026-10-11, the owner: *"left click held + CTRL/ALT tap on empty or on the pink face (=first touch held + second touch tap on empty or
 * on the pink face) rolls to the next axis"*) — does the second touch's release tap the yellow quad? A TAP (`tapped`), whose mode is still
 * HELD, while the FIRST touch is held (`firstHeld`), whose press did nothing else (`pressActed` false — ⭐ 2026-10-12: a press on a PLACED part
 * moves the orbit centre instead).
 * ⭐⭐ (2026-10-13, the owner: *"the second touch's tap on empty space to do exactly what the first touch's tap does: align to the yellow quad, or roll if already aligned there"*) — it TAPS THE YELLOW QUAD, as the first touch's tap on empty space does
 * (`orientTapShown`: aligned to it, or the roll when already aligned there).
 */
export function holdTapTapsYellow(tapped: boolean, mode: HoldMode, firstHeld: boolean, pressActed: boolean): boolean {
  return tapped && mode === "HELD" && firstHeld && !pressActed;
}

/**
 * ⛔⛔ (2026-10-13, the owner: *"The possibility to move the gizmo by second touch tap on mobile has disappeared. Reinstate."*) — the second touch's release that is a TAP (`isTapRelease`: within `tapMaxDuration` and the 8 mm
 * `doubleTapSlop`) is a tap even when the fingers' wobble already started the approach: a real finger's tap wanders a few mm, so the tap on a
 * placed part (the gizmo moved there) and the tap roll were lost. The mode the release is judged in: `HELD` for a tapped `APPROACH` (the caller
 * undoes it).
 */
export function holdTapMode(mode: HoldMode, tapped: boolean): HoldMode {
  return tapped && mode === "APPROACH" ? "HELD" : mode;
}
