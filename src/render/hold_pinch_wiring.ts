/**
 * ⭐⭐⭐ `D137` — **A HORIZONTAL PINCH WHILE HOLDING A BODY ZOOMS**, wired. ⛔ The rule is
 * `input/hold_pinch.ts`'s; this file finds the two fingers, holds the zoom's STATE (on until a dy) and applies it through
 * the same law and writer as the empty-space pinch (`PinchTracker`, `st.zoom`, `applyCamera`).
 */
import { holdPinch, holdPinchEnds } from "../input/hold_pinch";
import { PinchTracker } from "../input";
import { MOUSE_SECOND_ID } from "../input/mouse_second_touch";
import { applyCamera } from "./camera_rig";
import type { Held, SceneState } from "./scene_state";

/** The finger holding this grip. */
function holderOf(st: SceneState, grip: Held) {
  for (const p of st.router.all()) if (p.role === "OBJECT" && st.held.get(p.id) === grip) return p;
  return null;
}

/** This grip's second finger — on empty space or another body (`OUTSIDE`, `D124`), or on the body. */
function secondOf(st: SceneState, grip: Held) {
  for (const q of st.router.all())
    if (q.role === "OUTSIDE" || (q.role === "SECOND" && q.object === grip.mesh)) return q;
  return null;
}

/** ⛔ `D118`: a mouse never pinches — the wheel is the desktop's zoom. */
const isMouse = (st: SceneState, id: number): boolean =>
  st.pointerTypeOf.get(id) === "mouse" || id === MOUSE_SECOND_ID;

/**
 * ⭐⭐ Is this grip's two-finger gesture the hold-pinch? `true` when the move belongs to the ZOOM — the
 * caller then skips the translation and the roll (the owner: *"pause the translation and the roll"*).
 * ⭐ It starts on a sideways pinch with both `dy` zero, and ENDS as soon as either `dy` is not (amended).
 */
export function holdPinchStep(st: SceneState, grip: Held): boolean {
  const h = holderOf(st, grip);
  const s = secondOf(st, grip);
  if (!h || !s || isMouse(st, h.id) || isMouse(st, s.id)) {
    grip.holdPinch = null;
    return false;
  }
  if (grip.holdPinch !== null && grip.holdPinch.seq !== s.seq) grip.holdPinch = null;
  const second = grip.anchorMotion.get(s.seq);
  if (!second) return false;
  // ⭐ Each finger's latest DEADBANDED dy (`A11`, `motionDeadbandMm`) — the band decides both ways.
  const holderDy = grip.rec.step.dy;
  const secondDy = second.step.dy;
  // ⭐⭐ Amended: a running zoom ENDS as soon as either dy is not zero — and THIS move is the
  // translation's (or the roll's) again, so the caller applies it (the owner: *"toggled back"*).
  if (grip.holdPinch !== null && holdPinchEnds(holderDy, secondDy)) {
    grip.holdPinch = null;
    st.lastVerdict = "hold-pinch: ended (a finger moved vertically) — translation and roll back";
    st.hudDirty = true;
    return false;
  }
  if (grip.holdPinch === null) {
    const verdict = holdPinch(
      { axes: grip.rec.axes, dxSign: grip.holderDxSign, dy: holderDy, x: h.last.x },
      { axes: second.axes, dxSign: grip.anchorDxSign.get(s.seq) ?? 0, dy: secondDy, x: s.last.x },
    );
    if (verdict === null) return false;
    const tracker = new PinchTracker(st.cfg);
    tracker.begin(h.last, s.last);
    grip.holdPinch = { seq: s.seq, tracker, zoomAtStart: st.zoom };
    st.lastVerdict = `hold-pinch: ZOOM (${verdict === "OUT" ? "spreading" : "closing"}) — translation and roll paused until a finger moves vertically`;
    st.hudDirty = true;
    return true;
  }
  // ⭐ The empty-space pinch's own law: a ratio against the separation at the start, past its deadband.
  const factor = grip.holdPinch.tracker.scale(h.last, s.last);
  if (factor !== null) {
    st.zoom = grip.holdPinch.zoomAtStart * factor;
    applyCamera(st);
  }
  return true;
}
