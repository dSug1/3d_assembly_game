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
import { liveFinal } from "./goal_capture_wiring";
import { placedReport } from "./goal_capture_wiring";
import { showGoalPopup } from "./goal_popup";
import { goalSnaps, piecesMoved } from "../input/goal_commit";
import { setModelPose } from "./bodies";
import { worldPlacementOf } from "../core/object_model";
import type { SceneState } from "./scene_state";

/** ⭐ Commit the goal NOW; pop up the pieces that reached it (unless `quiet`). */
export function commitGoal(st: SceneState, quiet = false): void {
  const r = placedReport(st);
  // ⭐⭐ `D190`: only the pieces this action MOVED are re-judged; every other piece keeps its committed status.
  const moved =
    st.goalCommitWorld === null || st.sceneSpec.final === null
      ? null
      : piecesMoved(st.goalCommitWorld, st.world, (liveFinal(st) ?? st.sceneSpec.final).bodies.map((b) => b.id));
  // ⭐⭐⭐ (2026-10-15, *"set its transform to perfectly match the goal transform so there is no misalignment of any sort"*) each placed piece EXACTLY
  // on its goal (`goalSnaps`) — before the committed model is kept (no second commit for it), the capture's last pose with it (no second pull)
  if (r !== null && st.demo === null) {
    const depthOf = (id: string): number => {
      let d = 0;
      for (let o = st.world.objects.get(id); o?.parent != null && d < 64; o = st.world.objects.get(o.parent)) d++;
      return d;
    };
    const skip = (id: string): boolean => st.world.objects.get(id)?.frozen === true || (id === st.greenBox?.name && !st.orbitPiecePlaced);
    for (const s of goalSnaps(r.inPlaceIds, (id) => r.bodies.get(id)?.target ?? null, (id) => worldPlacementOf(st.world, id), skip, depthOf)) {
      const mesh = st.meshOf.get(s.id);
      if (mesh === undefined) continue;
      setModelPose(st, mesh, s.target, false);
      st.goalLastPose.set(s.id, s.target);
    }
  }
  st.goalCommitWorld = st.world;
  if (r === null) return;
  const baseline = st.goalCommit.never;
  const reached = st.goalCommit.commit(r.inPlaceIds, r.total, moved);
  // ⭐⭐ (2026-10-12, §21, *"at boot of the scene and also each time a part is seated"*) the orientation cube's directions read again
  st.orientDirty = true;
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
