/**
 * ⭐⭐ **WHAT THE SCORE OVERLAY SHOWS** (`D188`, the owner, 2026-09-30: *"create an UI overlay which displays the score. Use
 * the best practice in the video game industry to display the score. For the moment, display the episode count, the
 * time, and the goal."*). ⛔ The facts are the product's own — the episode tally (`EpisodeTally.total`), the clock the HUD
 * and the results read, the goal report (`core/goal.ts`) — this only words them; `render/score_overlay.ts` draws.
 *
 * ⭐ The casual-game pattern: three glanceable chips — **MOVES** (the episodes, named as the results card names them,
 * `D180`), **TIME** (`mm:ss`), **GOAL** (pieces placed / all, with a meter) — and nothing a player cannot act on.
 * ⛔ Hidden during a DEMO (nobody plays it). A scene with no goal shows no goal chip. **Free Flow** is not scored (`D101`):
 * the moves read `—`, labelled so.
 *
 * ⛔ ENGINE-FREE.
 */
import { formatElapsed } from "./episode_ledger";

export interface ScoreFacts {
  readonly episodes: number;
  /** The clock: since the first press, or the frozen result once the level is complete. */
  readonly elapsedMs: number;
  /** Pieces placed / all — `null` for a scene with no goal. */
  readonly goal: { readonly inPlace: number; readonly total: number } | null;
  readonly demo: boolean;
  readonly freeFlow: boolean;
}

export interface ScoreView {
  readonly visible: boolean;
  readonly moves: string;
  readonly movesLabel: string;
  readonly time: string;
  readonly goal: { readonly text: string; readonly fraction: number; readonly done: boolean } | null;
}

export function scoreView(f: ScoreFacts): ScoreView {
  const goal =
    f.goal === null || !(f.goal.total > 0)
      ? null
      : {
          text: `${f.goal.inPlace}/${f.goal.total}`,
          fraction: Math.min(1, Math.max(0, f.goal.inPlace / f.goal.total)),
          done: f.goal.inPlace >= f.goal.total,
        };
  return {
    visible: !f.demo,
    moves: f.freeFlow ? "—" : String(Math.max(0, Math.floor(f.episodes))),
    movesLabel: f.freeFlow ? "Free Flow" : "Moves",
    time: formatElapsed(f.elapsedMs),
    goal,
  };
}
