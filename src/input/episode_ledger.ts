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
 * | `SECOND` that pressed ANOTHER body — the unsnap's touch on a seated Follower, redirected to its root | ✅ — the action touch of an unsnap (the whole unsnap is ONE, `D115`) | C3 |
 * | `IGNORED` — a third finger | ⛔ | D3 |
 * | a PioneerFaceCursor grab — Free Flow | ⛔ | `D101` |
 * | ⭐⭐ **any touchpoint of a gesture that changed NOTHING** — a press and release on a body, a Space click
 * |   cancelled, a double tap that does not land (`D157`) | ⛔ — ZERO (`D158`: the gesture lands nothing) | — |
 * | an **undo** double tap | ⭐ ONE — the first tap changed nothing, the second's gesture undid (`D111`, by `D158`) | — |
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
  /**
   * The body under this touchpoint's ray was NOT one already held. ⭐ Only `SECOND` reads it: a
   * seated Follower's touch is redirected to its root, which the Pioneer's finger holds.
   */
  readonly pressedAnotherBody: boolean;
}

/** ⭐ The whole rule: does this touchpoint cost the player an episode? */
export function episodeCounts(f: EpisodeFacts): boolean {
  if (f.role === null) return false;
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

/**
 * ⭐⭐ **THE TALLY — one episode per ACTION, counted when its gesture ends** (`D115`, the owner,
 * 2026-09-27: *"When an action is triggered by two touch, count the episode only when the last of
 * the two touches is released (for example alignment of face)"* — and *"Make sure these actions
 * also have one episode count in desktop"*).
 *
 * ⭐ A counted touch is either a **HOLD** (it went down with nothing held) or an **ACTION** touch
 * (it went down while a body was held: the align press, the unalign tap, the unsnap's touch). ⭐⭐ An
 * action touch USES UP the hold it pairs with, so hold + press lands as ONE; a hold with no action
 * is one on its own. So a gesture costs `max(holds, actions)`: two separate holds are 2, a hold
 * with two actions in turn is 2, a hold with one action is 1.
 * ⛔ Nothing lands until the gesture's LAST touch lifts. ⚠ The desktop is the same path: the right
 * button's hold is touch #2's pointer and the left click is the real one (`D94`).
 * ⚠⚠ It REVISES `D103`/`SCORE.md`: the precise unsnap was priced 2 (hold + touch); it is 1 now.
 */
export class EpisodeTally {
  private holds = 0;
  private actions = 0;
  private totalCount = 0;

  /**
   * One touchpoint released. @param counts `episodeCounts`'s verdict. @param action it went down
   * while a body was held — it completes a two-touch action.
   */
  note(counts: boolean, action: boolean): void {
    if (!counts) return;
    if (action) this.actions += 1;
    else this.holds += 1;
  }

  /** What the open gesture will cost when it ends. */
  get pending(): number {
    return Math.max(this.holds, this.actions);
  }

  /**
   * The last touchpoint of the gesture released: its cost lands. Returns what landed.
   *
   * ⭐⭐⭐ `D158` — **A GESTURE THAT LANDS NOTHING COSTS NOTHING** (the owner, 2026-09-29: *"an action which does
   * not land into anything (for example: space pressed with no further action, left or right click and
   * unclick on an object, touch and release on an object) should count as zero episode"*; it absorbs
   * `D157`'s *"a double tap which does not land … should count as zero episode"*). ⭐ `changedModel` is the
   * undo layer's own answer — the model, the alignments, the seats and the cursors compared before and
   * after the gesture (`endGesture`) — so an align, an unalign, an unsnap, a move and an undo all land,
   * and a press and release, a cancelled Space click or a refused double tap do not.
   * @param changedModel did the gesture change the model? Default `true` — the rule before `D158`.
   */
  gestureEnded(changedModel = true): number {
    const landed = changedModel ? this.pending : 0;
    this.totalCount += landed;
    this.holds = 0;
    this.actions = 0;
    return landed;
  }

  get total(): number {
    return this.totalCount;
  }
}
