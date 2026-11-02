/**
 * ⭐⭐ **THE GESTURE'S SNAPSHOT** — the world at the first pointer down, compared while the gesture runs (`D187`: an episode lands the frame
 * its action is triggered) and at its end (`D158`: a gesture that changed nothing costs nothing).
 *
 * ⛔ (2026-11-02) this was `render/undo_wiring.ts`: the undo's restore and history are deleted with the parts' translation, rotation and
 * alignment (commit `d8134eb`). ⭐ `World` is immutable — every rule writes a NEW one — so the reference IS the snapshot.
 */
import { worldsDiffer } from "../core/gesture";
import type { SceneState } from "./scene_state";

/** ⭐ The first pointer down: remember the world as it stands. */
export function beginGesture(st: SceneState): void {
  st.gestureBefore = st.world;
  st.gestureChanged = false;
}

/**
 * ⭐⭐ `D187`: has the OPEN gesture changed the world yet? ⭐ Latched once true: the answer cannot become *no* again for the episode count
 * (what landed stays), and the comparison stops being paid for.
 */
export function gestureChangedSoFar(st: SceneState): boolean {
  if (st.gestureChanged) return true;
  const before = st.gestureBefore;
  if (before === null) return false;
  st.gestureChanged = worldsDiffer(before, st.world);
  return st.gestureChanged;
}

/** ⭐ The last pointer up: did the gesture change the world? */
export function endGesture(st: SceneState): boolean {
  const before = st.gestureBefore;
  st.gestureBefore = null;
  return before !== null && worldsDiffer(before, st.world);
}
