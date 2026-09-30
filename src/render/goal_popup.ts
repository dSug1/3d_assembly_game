/**
 * ⭐ `D142` — **THE "PIECE REACHED ITS GOAL" POP-UP.** A plain first version on purpose (the owner,
 * 2026-09-28: *"make a pop up in the HUD so the user can see one piece has reached its goal … to make
 * this pop up better later on for more game interactivity"* — the plan for that is `GM9` in
 * `queue_notes/PLAYABILITY_2026-09-27.md` §4.1). ⛔ It never takes a touch (`pointer-events: none`), and
 * a new message replaces the one showing.
 * ⭐ `D180`: styled by the UI theme (`ui-toast`) — its colours, type and fade are the theme's.
 */
import type { SceneState } from "./scene_state";

const SHOW_MS = 2200;

export function showGoalPopup(st: SceneState, text: string): void {
  let el = st.goalPopupEl;
  if (!el) {
    el = document.createElement("div");
    el.className = "ui-toast";
    el.setAttribute("data-role", "goal-popup");
    el.setAttribute("role", "status");
    document.body.appendChild(el);
    st.goalPopupEl = el;
  }
  el.textContent = text;
  el.style.opacity = "1";
  if (st.goalPopupTimer !== undefined) clearTimeout(st.goalPopupTimer);
  st.goalPopupTimer = setTimeout(() => {
    if (st.goalPopupEl) st.goalPopupEl.style.opacity = "0";
  }, SHOW_MS);
}
