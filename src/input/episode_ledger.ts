/**
 * ⭐⭐⭐ **THE TOUCHPOINT EPISODE LEDGER** (`D112`, the owner, 2026-09-27: *"Add the touchpoint
 * episode count and timer as first line in the HUD"*) — `SCORE.md` §3, built.
 *
 * ⭐ An episode is ONE touchpoint, press to release. ⛔ It is classified with the facts the gesture
 * rules themselves decided — the router's role, latched at press, and what the release DID — never
 * a second *"is this a tap"* (`D60`'s lesson, restated in `SCORE.md` §3).
 *
 * | the touchpoint | counts? | `SCORE.md` |
 * |---|---|---|
 * | `OBJECT` — it held a body (a hold, a drag, an align press, an unsnap's touch) | ✅ | C2, C3 |
 * | `OUTSIDE` with nothing held — orbit, pinch, camera reset | ⛔ | A1–A3 |
 * | `OUTSIDE` while a body is held — the axis finger, the mode-toggle tap | ⛔ | D2, B1 |
 * | `OUTSIDE` while held, **and it unaligned** (`D95`/`D107`) | ✅ | C1 |
 * | `SECOND` — on the held body itself | ⛔ | D2 |
 * | `SECOND` that pressed ANOTHER body — the unsnap's touch on a seated Follower, redirected to its root | ✅ — an unsnap costs 2 (`D103`) | C3 |
 * | `IGNORED` — a third finger | ⛔ | D3 |
 * | a PioneerFaceCursor grab — Free Flow | ⛔ | `D101` |
 * | the second tap of an **undo** double tap | ⛔ — the pair costs ONE (`D111`) | — |
 */
import type { PointerRole } from "./router";

/** What one touchpoint was and did, known at its release. */
export interface EpisodeFacts {
  /** The router's role, latched at press. ⚠ `null` for a pointer the router never saw (a cursor grab). */
  readonly role: PointerRole | null;
  /** How many bodies were held when this touchpoint went down — BEFORE it registered. */
  readonly heldAtPress: number;
  /** This touchpoint's tap released an alignment or a Pioneer's followers. */
  readonly unaligned: boolean;
  /** This touchpoint's tap was the SECOND of an undo double tap. */
  readonly undoSecondTap: boolean;
  /**
   * The body under this touchpoint's ray was NOT one already held. ⭐ Only `SECOND` reads it: a
   * seated Follower's touch is redirected to its root, which the Pioneer's finger holds.
   */
  readonly pressedAnotherBody: boolean;
}

/** ⭐ The whole rule: does this touchpoint cost the player an episode? */
export function episodeCounts(f: EpisodeFacts): boolean {
  if (f.role === null) return false;
  if (f.undoSecondTap) return false;
  switch (f.role) {
    case "OBJECT":
      return true;
    case "OUTSIDE":
      // ⭐ With nothing held it is the camera; with a body held it steers (or toggles) the hold —
      // unless its tap unaligned, which is assembly.
      return f.heldAtPress > 0 && f.unaligned;
    case "SECOND":
      return f.pressedAnotherBody;
    case "IGNORED":
      return false;
  }
}

/** `mm:ss`, the HUD's timer. ⛔ Never negative, never `NaN`. */
export function formatElapsed(ms: number): string {
  const total = Number.isFinite(ms) && ms > 0 ? Math.floor(ms / 1000) : 0;
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}
