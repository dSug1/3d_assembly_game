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
 *   travel past HALF the deadband says the two fingers are pinching (ZOOM), else it is the way in (WAY). Latched until the second touch lifts.
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

/** ⭐ May a second touch's hit be the pink face — a placed part (not frozen), never the orbited pieces, not in the edge band? */
export function pinkCandidate(hit: { readonly onOrbitedPiece: boolean; readonly frozen: boolean; readonly objectId: string | null; readonly inBand: boolean }): boolean {
  return !hit.inBand && !hit.onOrbitedPiece && !hit.frozen && hit.objectId !== null;
}

/**
 * ⭐ Does taking `next` change anything — is the piece NOT already aligned to it (`alignedKey`, the face it was last aligned to, as
 * `objectId/faceId`)? The same face again: nothing (the owner: *"same pink face pressed again does nothing"*). ⛔⛔ (2026-10-11, the owner:
 * *"when I left click on a new face and then CTRL+left click on the same face, the pink face is on this face but the piece's resting face does
 * not align with it. the logic is broken in this case"*) — it compared with the PINK face, and a plain left click on a part makes that face
 * the pink face (with the orbit centre) WITHOUT aligning: the same face then read as nothing to do. What matters is what the piece is
 * ALIGNED to.
 */
export function pinkChanges(alignedKey: string | null, next: { readonly objectId: string; readonly faceId: string }): boolean {
  return alignedKey !== `${next.objectId}/${next.faceId}`;
}

/**
 * ⭐ The highlights' strength, 0–1: `active` (the input running) — 1; else, from its end (`endedAt`, ms; `null` — never shown), 1 for
 * `holdMs`, then down to 0 over `fadeMs` (the owner: *"show pink highlights for a certain time … and then highlights fade gradually and
 * rapidly away. Set default timer 750 ms"*).
 */
export function highlightAlpha(now: number, active: boolean, endedAt: number | null, holdMs: number, fadeMs: number): number {
  if (active) return 1;
  if (endedAt === null) return 0;
  const t = now - endedAt;
  if (t <= holdMs) return 1;
  if (!(fadeMs > 0) || t >= holdMs + fadeMs) return 0;
  return 1 - (t - holdMs) / fadeMs;
}
