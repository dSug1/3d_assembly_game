/**
 * ⭐⭐ **A DEMO SCENE PLAYS ITSELF** (`D170`) — the render half: the clock and the writes. ⛔ Every decision
 * (the timing, the poses, the camera path) is `input/demo_playback.ts`'s; this file only asks and writes.
 * → `Claude/20_GAME_RULES/spec/DEMO_SCENE.md` §6.
 */
import { setWorldPlacement } from "../core/object_model";
import { advanceDemo, DEMO_LEAD_IN_S, demoCamera, demoDistanceM, demoMoveAt, demoPosesAt, fitDistanceM } from "../input/demo_playback";
import { orbitOffset } from "../input/orbit";
import { ORBIT_START_YAW_RAD } from "../core/scene_dims";
import { movesProgress } from "../core/demo_plan";
import { applyCamera } from "./camera_rig";
import { type SceneState } from "./scene_state";

/** ⭐ At boot: a scene with a plan starts its demo, and nothing in it can be picked while it plays. */
export function startDemo(st: SceneState): void {
  const plan = st.sceneSpec.demo;
  if (!plan) {
    st.demo = null;
    return;
  }
  // ⭐ `D171`: the distance at which the whole cube is on screen from the BOOT view, on this screen's aspect.
  const unitM = st.sceneSpec.unitM ?? 1;
  const half = [0, 1, 2].map((i) => ((plan.volume.max[i]! - plan.volume.min[i]!) / 2) * unitM) as [number, number, number];
  const off = orbitOffset(st.cfg, ORBIT_START_YAW_RAD, st.bootElevation, 1).offsetM;
  const len = Math.hypot(off[0], off[1], off[2]) || 1;
  const aspect = st.canvas.clientWidth / Math.max(1, st.canvas.clientHeight);
  const fitM = fitDistanceM(half, [off[0] / len, off[1] / len, off[2] / len], st.camera.fov, aspect);
  st.demo = { plan, leadS: DEMO_LEAD_IN_S, progress: 0, done: false, fitM };
  // ⛔ A demo is watched: a press on a piece is empty space (it orbits), never a grip that fights the replay.
  for (const mesh of st.meshOf.values()) mesh.isPickable = false;
}

/** ⭐ Every frame, before anything reads the model: advance the clock, write the poses and the camera. */
export function advanceDemoFrame(st: SceneState, dtSec: number): void {
  const d = st.demo;
  if (!d || d.done) return;
  const next = advanceDemo(d, dtSec, st.cfg.demoDurationS);
  d.leadS = next.leadS;
  d.progress = next.progress;
  const unitM = st.sceneSpec.unitM ?? 1;
  // ⭐ `D171`: the moves end before the demo does — the camera then slows through its last 15°.
  for (const [id, p] of demoPosesAt(d.plan, movesProgress(d.progress))) {
    st.world = setWorldPlacement(st.world, id, {
      position: [p.position[0] * unitM, p.position[1] * unitM, p.position[2] * unitM],
      orientation: p.orientation,
    });
  }
  const cam = demoCamera(st.bootElevation, d.progress);
  st.orbit.reset(cam.yawRad, cam.elevation);
  // ⭐ `D171`: the zoom that puts the camera at the demo's distance — the fit at the start, the rig's maximum at the end.
  const rigM = orbitOffset(st.cfg, cam.yawRad, cam.elevation, 1).radiusM;
  st.zoom = demoDistanceM(d.fitM, st.cfg.cameraRadiusMaxM, d.progress) / Math.max(1e-9, rigM);
  st.zoomAtPinchStart = st.zoom;
  applyCamera(st);
  st.hudDirty = true;
  // ⭐ Once the last move has landed the demo HOLDS: poses and camera are left to the player.
  if (d.progress >= 1) {
    d.done = true;
    for (const mesh of st.meshOf.values()) mesh.isPickable = true;
  }
}

/** ⭐ The HUD's score-line readout: `demo 12/30 SNAP Piece17`, then `demo ✅`. */
export function demoReadout(st: SceneState): string {
  const d = st.demo;
  if (!d) return "";
  if (d.done) return "  demo ✅";
  if (movesProgress(d.progress) >= 1) return `  demo ${d.plan.moves.length}/${d.plan.moves.length} — camera settling`;
  if (d.leadS > 0) return `  demo 0/${d.plan.moves.length}`;
  const i = demoMoveAt(d.plan, movesProgress(d.progress));
  const m = i === null ? null : d.plan.moves[i];
  return m ? `  demo ${i! + 1}/${d.plan.moves.length} ${m.kind} ${m.body} (${st.cfg.demoDurationS}s)` : "";
}
