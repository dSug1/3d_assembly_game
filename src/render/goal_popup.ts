/**
 * ⭐ `D142` — **THE "PIECE REACHED ITS GOAL" POP-UP.** A plain first version on purpose (the owner,
 * 2026-09-28: *"make a pop up in the HUD so the user can see one piece has reached its goal … to make
 * this pop up better later on for more game interactivity"* — the plan for that is `GM9` in
 * `queue_notes/PLAYABILITY_2026-09-27.md` §4.1). ⛔ It never takes a touch (`pointer-events: none`), and
 * a new message replaces the one showing.
 */
import type { SceneState } from "./scene_state";

const SHOW_MS = 2200;
const FADE_MS = 500;

export function showGoalPopup(st: SceneState, text: string): void {
  let el = st.goalPopupEl;
  if (!el) {
    el = document.createElement("div");
    el.setAttribute("data-role", "goal-popup");
    el.style.cssText = [
      "position:fixed",
      "left:50%",
      "top:22%",
      "transform:translateX(-50%)",
      "padding:10px 18px",
      "border-radius:12px",
      "background:rgba(18,64,36,0.88)",
      "color:#eafff0",
      "font:600 16px/1.3 system-ui,-apple-system,Segoe UI,sans-serif",
      "box-shadow:0 6px 24px rgba(0,0,0,0.35)",
      "pointer-events:none",
      "user-select:none",
      "z-index:120",
      "opacity:0",
      `transition:opacity ${FADE_MS}ms ease`,
      "white-space:nowrap",
    ].join(";");
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
