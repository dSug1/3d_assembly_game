/**
 * ⭐⭐⭐ (2026-11-18, `Claude/40_RENDER_SCENE/spec/FAST_ORBIT.md` §12.6 step S0, package FO3) THE SHADOW OF THE PICTURE — COMPUTED, RECORDED, NEVER DRAWN.
 *
 * Each frame, at the camera's stage, the pose handed to `zoneMixPose` (THE GHOST: the logic's pose, every change of frame at once), its twist about the
 * framed line since last frame's ghost (`twistAbout`), and two followers of it (`followStep`, `ROLL_FOLLOW_MS`):
 * * `held` — §12.4's gap as written: the twist taken ONLY while the gizmo is free in today's game (no turn under way: `asmZoneMix`, the square camera's,
 *   a tilt's exit — the frames `tiltClampStep` may refuse); a gap open goes on closing during a turn.
 * * `free` — what S1 would draw on THIS route: the twist taken as well during a timed turn that S1 makes free (a zone's turn whose twist at its first
 *   frame is under `FREE_TURN_MAX_DEG`, neither paced by the finger's travel `byMm` nor the way out `out`); a turn that stays (90° or more, `byMm`, `out`,
 *   the square camera's, a tilt's exit): the gap 0 while it runs (O5). ⚠ The route is today's: the gizmo still held by those turns.
 * Read by the recorders (`turn_rec.mjs`, `fast_walk_check.mjs`, `hand_replay.mjs`) as `st.asmRollShadow`. ⛔ Nothing here writes the camera, the piece,
 * the orbit or any state but its own: the replays are the base's bit for bit (checked, `FAST_ORBIT.md` §13).
 */
import type { Vec3 } from "../core/vec";
import { upSquareToView } from "../input/camera_frame";
import { squareTurning, type CamPose } from "../input/orbit_tilt";
import { followStep, FREE_TURN_MAX_DEG, framedLine, GAP_ZERO, onGlass, poseRolled, ROLL_FOLLOW_MS, twistAbout, type FollowMode } from "../input/roll_follow";
import { spitZone } from "./assembly_wiring";
import type { SceneState } from "./scene_state";

const DEG = Math.PI / 180;

/** ⭐ One frame of the shadow (`ghostIn`: the pose the camera's stage hands to `zoneMixPose`; `piece`: where the piece is drawn). */
export function rollShadowFrame(st: SceneState, piece: Vec3, ghostIn: CamPose, dtMs: number): void {
  const ghost: CamPose = { eye: ghostIn.eye, look: ghostIn.look, up: upSquareToView(ghostIn.up, [ghostIn.look[0] - ghostIn.eye[0], ghostIn.look[1] - ghostIn.eye[1], ghostIn.look[2] - ghostIn.eye[2]]) };
  const line = framedLine(ghost, piece);
  const was = st.asmRollShadow;
  const tw = was === null ? 0 : twistAbout(was.ghost, ghost, line.dir);
  const zm = st.asmZoneMix;
  const sq = squareTurning(st.asmSquare.n, st.asmSquare.target, st.asmSquare.q);
  const tl = st.asmTilt;
  const tiltHold = tl !== null && (tl.exit || tl.off);
  const free = zm === null && !sq && !tiltHold;
  // the turn under way, its twist at its first frame (O2: the change's angle known at the camera's stage), whether S1 would keep it as today's
  let turn: object | null = was?.turn ?? null;
  let turnTw = was?.turnTw ?? 0;
  let stays = was?.stays ?? false;
  const fresh = zm !== null && zm !== turn;
  if (fresh) {
    turn = zm;
    turnTw = tw;
    stays = zm.byMm === true || zm.out !== undefined || Math.abs(tw) >= FREE_TURN_MAX_DEG * DEG;
  }
  if (zm === null) turn = null;
  const dt = dtMs;
  const held = followStep(was?.held ?? GAP_ZERO, tw, dt, ROLL_FOLLOW_MS, free ? "TAKE" : "SKIP");
  const modeFree: FollowMode = sq || tiltHold || (zm !== null && stays) ? "ZERO" : "TAKE";
  const fr = followStep(was?.free ?? GAP_ZERO, tw, dt, ROLL_FOLLOW_MS, modeFree);
  const picture = poseRolled(ghost, line, fr.gap);
  // A2 on the shadow: the piece's and the look point's places on the glass, picture against ghost (half-glasses)
  let a2 = 0;
  if (fr.gap !== 0) {
    const fov = st.camera.fov;
    const asp = st.camera.getEngine().getAspectRatio(st.camera);
    for (const p of line.throughLook ? [piece, ghost.look] : [piece]) {
      const a = onGlass(ghost, p, fov, asp);
      const b = onGlass(picture, p, fov, asp);
      a2 = Math.max(a2, Math.hypot(a[0] - b[0], a[1] - b[1]));
    }
  }
  st.asmRollShadow = { ghost, dir: line.dir, piece, held, free: fr, turn, turnTw, stays, tw, gizmoFree: free, spit: spitZone(st) !== null, freshTurn: fresh, picture, a2 };
}
