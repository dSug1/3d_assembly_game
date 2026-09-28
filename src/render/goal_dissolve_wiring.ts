/**
 * ⭐⭐⭐ `D142` — **A SEATED FOLLOWER IN ITS GOAL POSE LETS GO OF ITS PIONEER**, wired. ⛔ The rule is
 * `input/goal_dissolve.ts`'s and the verdict `core/goal.ts`'s; this asks them once a frame — only while
 * some follower is seated — releases each couple through the one release path (`releaseAlignmentOf`:
 * constraint, seat, link; the highlights and the cursor follow from the link), and shows the pop-up.
 */
import { goalReport } from "../core/goal";
import { worldPlacementOf } from "../core/object_model";
import { followersToDissolve } from "../input/goal_dissolve";
import { releaseAlignmentOf } from "./alignment_wiring";
import { showGoalPopup } from "./goal_popup";
import type { SceneState } from "./scene_state";

export function dissolveOnGoal(st: SceneState): void {
  const final = st.sceneSpec.final;
  if (!final) return;
  const seated = st.links.alignedObjects().filter((f) => st.links.isSeated(f));
  if (seated.length === 0) return;
  const report = goalReport(final, st.sceneSpec.unitM ?? 1, (id) => worldPlacementOf(st.world, id), {
    positionM: st.cfg.goalPositionTolM,
    angleRad: (st.cfg.goalAngleTolDeg * Math.PI) / 180,
  });
  for (const f of followersToDissolve(seated, new Set(report.inPlaceIds))) {
    const pioneer = st.links.pioneerFor(f)?.objectId ?? "?";
    releaseAlignmentOf(st, f);
    st.lastVerdict = `goal: ${f} is in place — its couple with ${pioneer} dissolved`;
    showGoalPopup(st, `✅ ${f} reached its goal  ·  ${report.inPlace}/${report.total}`);
  }
}
