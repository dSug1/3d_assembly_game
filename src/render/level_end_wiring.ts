/**
 * ⭐⭐ **THE LEVEL END, WIRED** (`D180`) — the render half: each frame it reports the scene's facts to `core/level_end.ts`
 * and, on the frame the level completes, freezes the scene and hands the result to whoever listens (`main.ts` shows the
 * results screen). ⛔ No rule here — WHEN a level is complete is `levelComplete`'s.
 * ⭐ The goal is asked only while the scene is AT REST — no finger down, no snap animating — which is the only time the
 * rule can say yes, so a drag does not pay for a goal check every frame.
 */
import { goalReport } from "../core/goal";
import { worldPlacementOf } from "../core/object_model";
import type { LevelEndFacts } from "../core/level_end";
import type { SceneState } from "./scene_state";

export function levelEndFrame(st: SceneState, nowMs: number): void {
  const final = st.sceneSpec.final;
  if (!final || st.levelEnd.result !== null) return;
  const pointersDown = st.gestureSpan.active;
  const animating = st.alignSnaps.size > 0 || st.seatSnaps.size > 0;
  const demo: LevelEndFacts["demo"] = st.demo === null ? "NONE" : st.demo.done ? "DONE" : "PLAYING";
  if (pointersDown > 0 || animating || demo === "PLAYING" || (demo === "NONE" && st.sceneStartMs === null)) return;
  const report = goalReport(final, st.sceneSpec.unitM ?? 1, (id) => worldPlacementOf(st.world, id), {
    positionM: st.cfg.goalPositionTolM,
    angleRad: (st.cfg.goalAngleTolDeg * Math.PI) / 180,
  });
  const result = st.levelEnd.frame(
    {
      goalMet: report.met,
      pointersDown,
      animating,
      clockStartMs: st.sceneStartMs,
      demo,
      episodes: st.episodes.total,
      piecesInPlace: report.inPlace,
      pieces: report.total,
    },
    nowMs,
  );
  if (result === null) return;
  // ⭐ The scene is over: nothing in it can be picked any more (the results overlay covers the canvas as well).
  for (const mesh of st.meshOf.values()) mesh.isPickable = false;
  st.lastVerdict = `level complete — ${result.episodes} episodes`;
  st.hudDirty = true;
  st.onLevelEnd?.(result);
}
