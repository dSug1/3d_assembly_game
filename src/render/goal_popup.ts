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

/**
 * ⭐⭐ (2026-10-13, the owner: *"In such case the piece is blocked, Add a pop up message (same kind as the pop up when a part reach its goal) in red (instead of green) with written “Part is blocked. Double-click the part to restart” in desktop or “Part is blocked. Double-tap the part to restart” in mobile."*) — the BLOCKED pop-up: the goal pop-up's kind (`ui-toast`), red (`ui-toast--danger`), its own element
 * (a goal pop-up never replaces it); SHOWN while the piece is stuck (`pieceRespawnArmed`), hidden as soon as it is not (a free move, or the
 * respawn). `text` `null`: hidden.
 */
export function showBlockedPopup(st: SceneState, text: string | null): void {
  let el = st.blockedPopupEl;
  if (!el) {
    if (text === null) return;
    el = document.createElement("div");
    el.className = "ui-toast ui-toast--danger";
    el.setAttribute("data-role", "blocked-popup");
    el.setAttribute("role", "alert");
    document.body.appendChild(el);
    st.blockedPopupEl = el;
  }
  if (text !== null) el.textContent = text;
  el.style.opacity = text === null ? "0" : "1";
}

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
