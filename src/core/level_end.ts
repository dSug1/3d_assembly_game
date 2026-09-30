/**
 * ⭐⭐⭐ **THE LEVEL END** (`GM1`'s last item, `D180`, the owner, 2026-09-30: *"Build level end. Use the current light video
 * games best practices for the scaffold and user interface"*) → `Claude/20_GAME_RULES/spec/LEVEL_END.md`.
 *
 * ⭐ `PLAYABILITY` §2 item 4: *"level end — the clock and the count stop, the result is shown"*. This is the RULE: when a
 * level is complete, and what its result is. ⛔ Engine-free: the render layer only reports the facts of the frame and
 * shows what comes back.
 *
 * ⭐⭐ **A LEVEL IS COMPLETE when its goal is met AND THE SCENE IS AT REST** — no finger down, no snap still animating.
 * The goal is `core/goal.ts`'s verdict, the same one the HUD prints and the dissolve acts on (a second detector would be
 * a cue that can disagree with the rule — `PLAYABILITY` §4.1). ⭐ Waiting for rest is what lets the LAST move land and
 * be counted (an episode lands when its last touch lifts, `D115`), and what keeps the result from appearing under a
 * finger that is still pressing.
 * ⭐ And it must have been PLAYED: the clock started (a first press, `D112`) — a level that boots already solved is not
 * won by nobody. A DEMO level is complete when its replay is done (no one plays it).
 * ⛔ **It latches**: once complete, nothing un-completes it, and the result is frozen — the clock and the count stop
 * there (`GM3`: *"first press → detection"*).
 */

/** ⭐ What a frame tells the rule. */
export interface LevelEndFacts {
  /** `core/goal.ts`'s verdict, this frame. */
  readonly goalMet: boolean;
  /** Touchpoints of the open gesture still down (`GestureSpan.active`). */
  readonly pointersDown: number;
  /** A snap (alignment slerp, seat lerp) still animating a body. */
  readonly animating: boolean;
  /** When the first press started the clock, ms — `null` until then. */
  readonly clockStartMs: number | null;
  /** `NONE` for a played level; a demo level reports its replay. */
  readonly demo: "NONE" | "PLAYING" | "DONE";
  /** The episode count (`D112`), and the pieces in place / in all (`GoalReport`). */
  readonly episodes: number;
  readonly piecesInPlace: number;
  readonly pieces: number;
}

/** ⭐ The result a completed level shows — `GM5` will score it (episodes against the solved optimum, and the time). */
export interface LevelResult {
  readonly kind: "PLAYED" | "DEMO";
  /** Touchpoint episodes — a player reads them as MOVES. `0` for a demo. */
  readonly episodes: number;
  /** From the first press to completion, ms. `0` for a demo. */
  readonly elapsedMs: number;
  readonly piecesInPlace: number;
  readonly pieces: number;
}

/** ⭐ Is the level complete this frame? (The whole rule, one expression.) */
export function levelComplete(f: LevelEndFacts): boolean {
  if (!f.goalMet || f.pointersDown > 0 || f.animating) return false;
  return f.demo === "DONE" || (f.demo === "NONE" && f.clockStartMs !== null);
}

/**
 * ⭐⭐ **THE LATCH** — fed every frame; returns the result ON THE FRAME the level completes, `null` on every other frame.
 * `result` holds it afterwards, frozen.
 */
export class LevelEnd {
  private done: LevelResult | null = null;

  frame(f: LevelEndFacts, nowMs: number): LevelResult | null {
    if (this.done !== null || !levelComplete(f)) return null;
    const played = f.demo === "NONE";
    this.done = {
      kind: played ? "PLAYED" : "DEMO",
      episodes: played ? f.episodes : 0,
      elapsedMs: played && f.clockStartMs !== null ? Math.max(0, nowMs - f.clockStartMs) : 0,
      piecesInPlace: f.piecesInPlace,
      pieces: f.pieces,
    };
    return this.done;
  }

  /** The frozen result, or `null` while the level plays. */
  get result(): LevelResult | null {
    return this.done;
  }
}
