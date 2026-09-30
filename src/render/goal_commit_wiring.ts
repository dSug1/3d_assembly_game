/**
 * ⭐⭐⭐ **THE GOAL COMMIT, WIRED** (`D189`) — WHEN the placed pieces are committed, and the pop-up for each piece that
 * reached its goal. ⛔ The rule (what *reached* means) is `input/goal_commit.ts`'s.
 *
 * ⭐ An action COMPLETES — and the goal is committed — when:
 * * the scene comes to REST after a change: no finger down, no snap, pull, alignment or rotation-increment chase animating, and the model is not the
 *   one last committed (`goalCommitFrame`, every frame — cheap: `World` is immutable, so "unchanged" is one comparison);
 * * a snap LANDS, a goal pull LANDS, a couple DISSOLVES (their wiring calls `commitGoal`) — mid-gesture, since a snap stops
 *   the drag that made it (`D139`).
 * ⛔ Never midway through a movement: the HUD's `goal n/41` and the score bar read the COMMITTED count.
 * ⚠ An UNDO commits silently (its restore is not an achievement), and a DEMO shows no pop-up.
 */
import { placedReport } from "./goal_capture_wiring";
import { showGoalPopup } from "./goal_popup";
import { piecesMoved } from "../input/goal_commit";
import type { SceneState } from "./scene_state";

/** ⭐ Commit the goal NOW; pop up the pieces that reached it (unless `quiet`). */
export function commitGoal(st: SceneState, quiet = false): void {
  const r = placedReport(st);
  // ⭐⭐ `D190`: only the pieces this action MOVED are re-judged; every other piece keeps its committed status.
  const moved =
    st.goalCommitWorld === null || st.sceneSpec.final === null
      ? null
      : piecesMoved(st.goalCommitWorld, st.world, st.sceneSpec.final.bodies.map((b) => b.id));
  st.goalCommitWorld = st.world;
  if (r === null) return;
  const baseline = st.goalCommit.never;
  const reached = st.goalCommit.commit(r.inPlaceIds, r.total, moved);
  st.hudDirty = true;
  if (baseline || quiet || st.demo !== null || reached.length === 0) return;
  const who = reached.length === 1 ? `${reached[0]} reached its goal` : `${reached.join(", ")} reached their goals`;
  showGoalPopup(st, `✅ ${who}  ·  ${st.goalCommit.count}/${st.goalCommit.total}`);
}

/** ⭐ Every frame: the boot's baseline, then a commit whenever the scene comes to rest on a changed model. */
export function goalCommitFrame(st: SceneState): void {
  if (!st.sceneSpec.final) return;
  if (st.goalCommit.never) {
    commitGoal(st, true);
    return;
  }
  const atRest =
    st.gestureSpan.active === 0 && st.alignSnaps.size === 0 && st.seatSnaps.size === 0 && st.goalPulls.size === 0 &&
    st.rotationFollower.size === 0;
  if (!atRest || st.world === st.goalCommitWorld) return;
  commitGoal(st, st.goalCommitQuiet);
  st.goalCommitQuiet = false;
}
