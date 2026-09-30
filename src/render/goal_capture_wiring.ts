/**
 * ⭐⭐⭐ **THE GOAL CAPTURE, WIRED** (`D183`) — each frame: which pieces MOVED, which are inside their goal margins
 * (`core/goal.ts`), which the rule offers to the pull (`input/goal_capture.ts`); a pull starts only if its flight is
 * CLEAR (`D182`'s path check), releases the piece's alignment or seat, stops the drag that made it (`D139`), and lands on
 * the exact goal pose with the pop-up. ⛔ No rule here.
 * ⭐ Run BEFORE `syncSeats`: the goal wins over the snap.
 *
 * ⭐⭐ **TWO MARGINS** (the owner, 2026-09-30): a GRABBED piece — pressed by a finger or the mouse, or dragged as an
 * assembly's root — within the snap's own (`captureOffsetMm` on the glass at the camera NOW, `snapConeDeg`), so the goal
 * feels as the snap does; a piece NEVER grabbed within `ungrabbedGoalMm` / `ungrabbedGoalDeg` (1 mm, 1°), so zooming
 * out cannot place a piece nobody moved. ⭐ One report serves the capture, the HUD, the dissolve and the level end.
 */
import { goalReport, type GoalReport, type GoalTolerance, type Pose } from "../core/goal";
import { rootOf } from "../core/collision";
import { worldPlacementOf } from "../core/object_model";
import { qAngle, qconj, qmul, sub, length } from "../core/vec";
import { snapPathBlockedBy } from "../input/snap";
import { magnetEase } from "../input/seat_snap";
import { captureOffsetM } from "../input/highlight";
import { collisionSetup } from "./collision_wiring";
import { releaseAlignmentOf } from "./alignment_wiring";
import { setModelPose } from "./bodies";
import { commitGoal } from "./goal_commit_wiring";
import { offsetRadiusM } from "./seat_wiring";
import type { SceneState } from "./scene_state";

/** ⭐ A GRABBED piece's margins — the snap's, at the camera NOW. */
export function looseTolerance(st: SceneState): GoalTolerance {
  return { positionM: offsetRadiusM(st), angleRad: (st.cfg.snapConeDeg * Math.PI) / 180 };
}

/** ⭐ A piece NEVER grabbed: `ungrabbedGoalMm` on the glass at the camera NOW, `ungrabbedGoalDeg`. */
function strictTolerance(st: SceneState): GoalTolerance {
  return {
    positionM: captureOffsetM(st.cfg.ungrabbedGoalMm, st.camera.radius, st.camera.fov, st.canvas.clientHeight),
    angleRad: (st.cfg.ungrabbedGoalDeg * Math.PI) / 180,
  };
}

/** ⭐ Each piece's margins: loose once grabbed, strict before. */
export function goalTolOf(st: SceneState): (id: string) => GoalTolerance {
  const loose = looseTolerance(st);
  const strict = strictTolerance(st);
  return (id) => (st.grabbed.has(id) ? loose : strict);
}

/** ⭐ The goal as it stands NOW — `null` for a scene with no goal. */
export function placedReport(st: SceneState): GoalReport | null {
  const final = st.sceneSpec.final;
  if (!final) return null;
  return goalReport(final, st.sceneSpec.unitM ?? 1, (id) => worldPlacementOf(st.world, id), looseTolerance(st), goalTolOf(st));
}

const MOVED_M = 1e-7;
const MOVED_RAD = 1e-6;

function movedSince(a: Pose, b: Pose): boolean {
  return length(sub(a.position, b.position)) > MOVED_M || qAngle(qmul(a.orientation, qconj(b.orientation))) > MOVED_RAD;
}

export function goalCaptureFrame(st: SceneState, nowMs: number): void {
  const final = st.sceneSpec.final;
  // ⛔ A demo plays itself; a finished level is frozen.
  if (!final || st.demo !== null || st.levelEnd.result !== null) return;
  // ⭐ A grip grabs its body and, for a translation forwarded to it, the assembly's root.
  for (const grip of st.held.values()) {
    const id = st.idOf.get(grip.mesh);
    if (id !== undefined) {
      st.grabbed.add(id);
      st.grabbed.add(rootOf(st.world, id));
    }
  }
  const moved = new Set<string>();
  for (const b of final.bodies) {
    const p = worldPlacementOf(st.world, b.id);
    if (!p) continue;
    const last = st.goalLastPose.get(b.id);
    if (last !== undefined && movedSince(last, p)) moved.add(b.id);
    st.goalLastPose.set(b.id, p);
  }
  if (moved.size > 0 || st.goalCapture.hasPending() || st.goalCapture.needsSight()) {
    const report = placedReport(st)!;
    const inside = new Set(report.inPlaceIds);
    const seen = final.bodies.flatMap((b) =>
      !report.bodies.has(b.id) || st.goalPulls.has(b.id) ? [] : [{ id: b.id, inside: inside.has(b.id), moved: moved.has(b.id) }],
    );
    for (const id of st.goalCapture.frame(seen)) startPull(st, id, report, nowMs);
  }
  advancePulls(st, nowMs);
}

function startPull(st: SceneState, id: string, report: GoalReport, nowMs: number): void {
  const g = report.bodies.get(id);
  const from = worldPlacementOf(st.world, id);
  if (!g || !from || st.world.objects.get(id)?.frozen === true) return;
  // ⭐⭐ `D182`'s rule: only a flight that is CLEAR starts — a blocked one waits, pending, and holds nothing.
  const pioneer = st.links.pioneerFor(id)?.objectId ?? null;
  const blocker = snapPathBlockedBy(st.world, id, g.target, collisionSetup(st, pioneer === null ? null : [id, pioneer]));
  if (blocker !== null) {
    const wait = `goal: ${id} waits — ${blocker} is in its way`;
    if (st.lastVerdict !== wait) {
      st.lastVerdict = wait;
      st.hudDirty = true;
    }
    return;
  }
  // ⭐ The goal wins: a snap in flight is dropped, the alignment (and its seat) released — the piece keeps its pose.
  st.seatSnaps.cancel(id);
  st.rotationFollower.cancel(id);
  if (pioneer !== null) releaseAlignmentOf(st, id);
  st.goalCapture.captured(id);
  st.goalPulls.start(id, from, g.target, nowMs);
  // ⭐⭐ `D139`: the drag that made the capture STOPS — a grip on the piece keeps the roll alone until its finger lifts.
  for (const [pointerId, grip] of st.held) {
    const on = st.idOf.get(grip.mesh) === id || st.rawPressedBody.get(pointerId) === id;
    if (on && !grip.seatLocked) {
      grip.seatLocked = true;
      grip.seatSeq = Math.max(-1, ...st.router.all().map((p) => p.seq));
    }
  }
  st.lastVerdict = `goal: ${id} captured (${(g.positionM * 1000).toFixed(0)} mm, ${((g.angleRad * 180) / Math.PI).toFixed(1)}°)`;
  st.hudDirty = true;
}

function advancePulls(st: SceneState, nowMs: number): void {
  for (const step of st.goalPulls.advance(nowMs, st.cfg.snapMs, magnetEase)) {
    const mesh = st.meshOf.get(step.id);
    if (!mesh) {
      st.goalPulls.cancel(step.id);
      continue;
    }
    const moved = setModelPose(st, mesh, step.pose, true);
    // ⭐ As a snap's: something moved into a clear flight — cancelled, and the piece re-offered while it stays inside.
    if (moved !== null && moved.blockedBy !== null) {
      st.goalPulls.cancel(step.id);
      st.goalCapture.retry(step.id);
      st.lastVerdict = `goal: ${step.id} CANCELLED — ${moved.blockedBy} is in the way`;
      st.hudDirty = true;
      continue;
    }
    if (!step.done) continue;
    st.lastVerdict = `goal: ${step.id} is in place`;
    st.hudDirty = true;
    // ⭐ `D189`: a pull LANDING completes an action — the goal is committed, and only a piece not placed before pops up.
    commitGoal(st);
  }
}
