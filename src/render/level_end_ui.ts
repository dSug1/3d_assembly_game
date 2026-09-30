/**
 * ⭐⭐⭐ **THE RESULTS SCREEN** (`D180`, the owner, 2026-09-30: *"Build level end. Use the current light video games best
 * practices for the scaffold and user interface"*) → `Claude/20_GAME_RULES/spec/LEVEL_END.md` §2.
 *
 * ⭐ The casual-game pattern: a short beat after the last piece lands (`celebrateDelayMs`), then a dimmed scene with a
 * card low on the screen (a bottom sheet; to the side in landscape), so the finished build stays in view — a clear headline, the three numbers a player cares about (moves, time, pieces), ONE primary action and two
 * secondary ones (*Next level* · *Retry* · *Level select*, `GAME_STRUCTURE.md` §4). The overlay covers the canvas, so no
 * touch reaches the scene after the end: the count cannot move.
 * ⭐ Big touch targets, the safe areas, a focused primary button (Enter works on a keyboard), `role="dialog"`, and no
 * animation under `prefers-reduced-motion` — all from the theme's stylesheet.
 * ⛔ No decision here: WHEN is `core/level_end.ts`'s, WHERE each button goes is `core/game_route.ts`'s `resultTarget`.
 */
import type { GameContent } from "../core/game_structure";
import { levelsOf, resultTarget, type ResultAction } from "../core/game_route";
import type { LevelResult } from "../core/level_end";
import { formatElapsed } from "../input/episode_ledger";
import type { Navigate } from "./screens";
import { ui } from "./ui_theme";

export function showLevelResults(
  content: GameContent,
  /** The scene index that was played. */
  index: number,
  result: LevelResult,
  navigate: Navigate,
  delayMs: number,
  parent: HTMLElement = document.body,
): void {
  const level = levelsOf(content)[index];
  const demo = result.kind === "DEMO";

  // ⭐ A bottom sheet (to the side in landscape): the finished build — the reward — stays in view above the card.
  const overlay = ui("div", "ui-overlay ui-overlay--sheet");
  overlay.setAttribute("data-role", "level-results");
  overlay.setAttribute("role", "dialog");
  overlay.setAttribute("aria-modal", "true");
  overlay.setAttribute("aria-labelledby", "ui-results-title");
  const card = ui("div", "ui-card");
  const title = ui("h2", "ui-title ui-title--hero", demo ? "Demo complete" : "Level complete!");
  title.id = "ui-results-title";
  card.append(ui("div", "ui-badge", demo ? "▶ Watched" : "★ Solved"), title);
  if (level) card.append(ui("p", "ui-subtitle", level.title));

  if (!demo) {
    const stats = ui("div", "ui-stats");
    const stat = (value: string, label: string): HTMLElement => {
      const s = ui("div", "ui-stat");
      s.append(ui("span", "ui-stat-value", value), ui("span", "ui-stat-label", label));
      return s;
    };
    // ⭐ A player reads an EPISODE as a MOVE (`SCORE.md`'s unit, named for the player).
    stats.append(
      stat(String(result.episodes), result.episodes === 1 ? "move" : "moves"),
      stat(formatElapsed(result.elapsedMs), "time"),
      stat(`${result.piecesInPlace}/${result.pieces}`, "pieces"),
    );
    card.append(stats);
  }

  const act = (action: ResultAction): void => {
    const href = resultTarget(action, window.location.href, content, index);
    if (href === null) return;
    card.replaceChildren(ui("div", "ui-muted", "loading…"));
    navigate(href);
  };
  const button = (label: string, action: ResultAction, primary: boolean): HTMLButtonElement => {
    const b = ui("button", primary ? "ui-button ui-button--primary" : "ui-button", label);
    b.setAttribute("data-action", action);
    b.addEventListener("click", () => act(action));
    return b;
  };
  // ⭐ ONE primary action: the next level when there is one, else playing this one again.
  const hasNext = !demo && resultTarget("NEXT", window.location.href, content, index) !== null;
  const actions = ui("div", "ui-actions");
  const retry = demo ? "Watch again" : "Retry";
  const primary = hasNext ? button("Next level", "NEXT", true) : button(retry, "RETRY", true);
  actions.append(primary);
  if (hasNext) actions.append(button(retry, "RETRY", false));
  actions.append(button("Level select", "LEVELS", false));
  card.append(actions);
  overlay.append(card);

  // ⭐ The beat: the last piece is SEEN landing before the card covers the scene.
  window.setTimeout(() => {
    parent.appendChild(overlay);
    primary.focus({ preventScroll: true });
  }, Math.max(0, delayMs));
}
