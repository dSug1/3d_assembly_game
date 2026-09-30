/**
 * ⭐⭐ **THE SCORE OVERLAY** (`D188`) — draws `input/score_view.ts`'s answer: one bar at the top centre, three chips (moves,
 * time, goal). ⛔ It never takes a touch (`pointer-events: none` in its class) and carries no style of its own: every
 * colour, size and motion is the UI theme's (`ui-scorebar`, `ui-score-*` in `render/ui_theme.ts`), so a theme swap restyles
 * it with every other screen. ⭐ A value that goes UP bumps (moves, pieces placed) — the feedback a player reads without
 * looking; the theme's `prefers-reduced-motion` rule turns it off.
 */
import type { ScoreView } from "../input/score_view";

export interface ScoreOverlay {
  update(view: ScoreView): void;
}

function chip(parent: HTMLElement, label: string): { root: HTMLDivElement; value: HTMLSpanElement; label: HTMLSpanElement } {
  const root = document.createElement("div");
  root.className = "ui-score-chip";
  const value = document.createElement("span");
  value.className = "ui-score-value";
  const lab = document.createElement("span");
  lab.className = "ui-score-label";
  lab.textContent = label;
  root.append(value, lab);
  parent.appendChild(root);
  return { root, value, label: lab };
}

/** ⭐ Replay the bump on a value that just went up. */
function bump(el: HTMLElement): void {
  el.classList.remove("ui-score--bump");
  void el.offsetWidth;
  el.classList.add("ui-score--bump");
}

export function createScoreOverlay(parent: HTMLElement = document.body): ScoreOverlay {
  const bar = document.createElement("div");
  bar.className = "ui-scorebar";
  bar.setAttribute("data-role", "scorebar");
  bar.setAttribute("role", "group");
  bar.setAttribute("aria-label", "Score");
  const moves = chip(bar, "Moves");
  const time = chip(bar, "Time");
  const goal = chip(bar, "Goal");
  const meter = document.createElement("span");
  meter.className = "ui-score-meter";
  const fill = document.createElement("span");
  fill.className = "ui-score-meter-fill";
  meter.appendChild(fill);
  goal.root.appendChild(meter);
  parent.appendChild(bar);

  let lastMoves: string | null = null;
  let lastPlaced = -1;
  return {
    update(v) {
      bar.hidden = !v.visible;
      if (!v.visible) return;
      if (moves.value.textContent !== v.moves) {
        if (lastMoves !== null && Number(v.moves) > Number(lastMoves)) bump(moves.value);
        moves.value.textContent = v.moves;
        lastMoves = v.moves;
      }
      if (moves.label.textContent !== v.movesLabel) moves.label.textContent = v.movesLabel;
      if (time.value.textContent !== v.time) time.value.textContent = v.time;
      goal.root.hidden = v.goal === null;
      if (v.goal !== null) {
        const text = v.goal.done ? `${v.goal.text} ✓` : v.goal.text;
        if (goal.value.textContent !== text) goal.value.textContent = text;
        const placed = Math.round(v.goal.fraction * 1e6);
        if (lastPlaced >= 0 && placed > lastPlaced) bump(goal.value);
        lastPlaced = placed;
        fill.style.setProperty("--ui-fill", String(v.goal.fraction));
        goal.root.classList.toggle("ui-score-chip--done", v.goal.done);
      }
    },
  };
}
