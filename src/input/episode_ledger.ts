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
  /**
   * ⭐ `D159`: this touchpoint CONTINUES another's hold — the latched HitFace that took over a Space-frozen
   * drag. The drag's touch is the hold; this one adds nothing, so the action lands ONE episode.
   */
  readonly continuesAnother?: boolean;
}

/** ⭐ The whole rule: does this touchpoint cost the player an episode? */
export function episodeCounts(f: EpisodeFacts): boolean {
  if (f.role === null) return false;
  if (f.continuesAnother === true) return false;
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
 * ⛔ Nothing lands until the gesture's LAST touch lifts (⛔ `D187`: it lands when the action is TRIGGERED, `sync`). ⚠ The desktop is the same path: the right
 * button's hold is touch #2's pointer and the left click is the real one (`D94`).
 * ⚠⚠ It REVISES `D103`/`SCORE.md`: the precise unsnap was priced 2 (hold + touch); it is 1 now.
 */
export class EpisodeTally {
  /** ⭐ `D187`: every counted touch of the open gesture, by its press key — re-classified at its release. */
  private readonly touches = new Map<number, { counts: boolean; action: boolean }>();
  private nextKey = -1;
  /** What the open gesture has already landed. ⛔ Never taken back. */
  private landedCount = 0;
  private totalCount = 0;

  /**
   * ⭐ `D187`: one touchpoint, classified — at its PRESS with what is known then, and again at its release (the same
   * `key` replaces the first answer: an unalign tap is only known to count once it has unaligned).
   * @param counts `episodeCounts`'s verdict. @param action it went down while a body was held — a two-touch action.
   */
  touch(key: number, counts: boolean, action: boolean): void {
    this.touches.set(key, { counts, action });
  }

  /** One touchpoint, released, with no press record (a fresh key) — `D115`'s original form. */
  note(counts: boolean, action: boolean): void {
    this.touch(this.nextKey--, counts, action);
  }

  /** What the open gesture costs once it has changed the model — `max(holds, actions)` (`D115`). */
  get pending(): number {
    let holds = 0;
    let actions = 0;
    for (const t of this.touches.values()) {
      if (!t.counts) continue;
      if (t.action) actions += 1;
      else holds += 1;
    }
    return Math.max(holds, actions);
  }

  /**
   * ⭐⭐⭐ `D187` — **AN EPISODE LANDS WHEN ITS ACTION IS TRIGGERED** (the owner, 2026-09-30: *"the episode count shall be
   * incremented at the first touch or click or delta position which triggers an action which will increment the episode
   * count, not at the release of the touch or click. For example: left click pressed / first touch on an object does
   * nothing (because the user can still release the input) but as soon as the delta position translates / rotates the
   * object, the count shall be incremented."*). Asked every frame and at every release: once the gesture has changed the
   * model, what it costs is landed NOW; a later action in the same gesture lands when it adds to the cost. ⛔ A press
   * alone lands nothing — `D158`'s *a gesture that changes nothing costs nothing* holds, decided at the first change
   * instead of at the end. ⛔ What has landed is never taken back (a drag brought back to where it started still cost).
   * ⛔ It REVISES `D115`'s *"count the episode only when the last of the two touches is released"*; the price of a
   * two-touch action is unchanged (one).
   * @returns what landed this call.
   */
  sync(changedModel: boolean): number {
    if (!changedModel) return 0;
    const add = Math.max(0, this.pending - this.landedCount);
    this.landedCount += add;
    this.totalCount += add;
    return add;
  }

  /**
   * The last touchpoint of the gesture released: whatever is still due lands (`sync`), and the gesture closes.
   * Returns what the WHOLE gesture landed.
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
    this.sync(changedModel);
    const landed = this.landedCount;
    this.touches.clear();
    this.landedCount = 0;
    return landed;
  }

  get total(): number {
    return this.totalCount;
  }
}
