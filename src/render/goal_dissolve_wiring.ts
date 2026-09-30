/**
 * ⭐⭐⭐ `D142` — **A SEATED FOLLOWER IN ITS GOAL POSE LETS GO OF ITS PIONEER**, wired. ⛔ The rule is
 * `input/goal_dissolve.ts`'s and the verdict `core/goal.ts`'s; this asks them once a frame — only while
 * some follower is seated — releases each couple through the one release path (`releaseAlignmentOf`:
 * constraint, seat, link; the highlights and the cursor follow from the link), and shows the pop-up.
 * ⭐ `D143`: then the MATE — the piece's spin about its FollowerFace normal is set onto its goal
 * (`mateSpin`). ⚠ Written without collision, as the alignment turn is (`COLLISION.md` §4): it is at
 * most the snap cone (`D183`), and it is the product landing a pose, not a gesture.
 */
import { goalReport } from "../core/goal";
import { alignedFaceOf } from "../core/face_pick";
import { faceWorld, worldPlacementOf } from "../core/object_model";
import { followersToDissolve, mateSpin } from "../input/goal_dissolve";
import { setModelPose } from "./bodies";
import { releaseAlignmentOf } from "./alignment_wiring";
import { commitGoal } from "./goal_commit_wiring";
import { goalTolOf, looseTolerance } from "./goal_capture_wiring";
import type { SceneState } from "./scene_state";

export function dissolveOnGoal(st: SceneState): void {
  const final = st.sceneSpec.final;
  if (!final) return;
  const seated = st.links.alignedObjects().filter((f) => st.links.isSeated(f));
  if (seated.length === 0) return;
  // ⭐ `D183`: PLACED — the snap's margins, or the never-grabbed ones. ⚠ A seated piece whose goal capture was BLOCKED lands here:
  // released, and only its spin mated, as before `D183`.
  const report = goalReport(final, st.sceneSpec.unitM ?? 1, (id) => worldPlacementOf(st.world, id), looseTolerance(st), goalTolOf(st));
  let dissolved = false;
  for (const f of followersToDissolve(seated, new Set(report.inPlaceIds))) {
    const pioneer = st.links.pioneerFor(f)?.objectId ?? "?";
    // ⚠ Read the FollowerFace BEFORE the release: it is derived from the constraint the release evicts.
    const faceId = alignedFaceOf(st.world, f);
    releaseAlignmentOf(st, f);
    // ⭐ `D183`: a dissolve IS its capture — disarmed, so the next frame does not capture it again (a second pop-up).
    st.goalCapture.captured(f);
    const face = faceId === null ? null : faceWorld(st.world, f, faceId);
    const pose = worldPlacementOf(st.world, f);
    const target = report.targetOrientations.get(f);
    const mesh = st.meshOf.get(f);
    if (face && pose && target && mesh) setModelPose(st, mesh, mateSpin(pose, face.centre, face.normal, target), false);
    st.lastVerdict = `goal: ${f} is in place — its couple with ${pioneer} dissolved`;
    dissolved = true;
  }
  // ⭐ `D189`: a dissolve completes an action — committed; a piece already placed before says nothing.
  if (dissolved) commitGoal(st);
}
