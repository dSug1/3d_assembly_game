/**
 * ⭐⭐⭐ (2026-11-20, `Claude/40_RENDER_SCENE/spec/CAMERA_FOLLOWS_GIZMO.md` §13 — F2) THE CAMERA FOLLOWER AT THE CAMERA'S STAGE, far out: the camera a simple polar
 * orbit (world up) about the orbit's centre, following the direction ASKED (`st.asmAsk`) through ONE ease, round the vertical by place; the piece hung
 * along the SAME followed direction from the gizmo's foot. The rules are pure (`input/camera_follow.ts`); this file holds the state and the call.
 *
 * WHERE FAR ENDS: the follower draws while the switch is 1 (`cameraFollower`), no tilt is on (`asmTilt`), the automatic tilt is not latched (`asmTiltAuto`:
 * the approach within `tiltAutoM`, 0.6 m, of the gizmo; off again beyond 0.65 m), the square camera's share is 0 and no timed turn runs (`asmZoneMix`: the
 * way out of close in). Elsewhere (close in) the live picture (`rollPictureFrame`, the carried up) draws, frame for frame as before; the follower restarts
 * at rest on the piece's drawn direction when far begins again. ⛔ No blend at that boundary yet (F3).
 *
 * Far out, a change of frame the logic asks (`asmChange`) is applied AT ONCE (no timed turn: the follower is the picture's one ease) with the dy hold from
 * the LOGIC's crossing (`holdAtCrossing` — OP8, as `1.0.147-`); no half turn exists, so no gizmo hold (D-F4). Nothing here undoes a turn or a hold.
 */
import type { Vec3 } from "../core/vec";
import { followPose, followStart, followStep, type FollowState } from "../input/camera_follow";
import { holdAtCrossing } from "../input/orbit_tilt";
import { changeApply, spitZone } from "./assembly_wiring";
import { upSquareToView } from "../input/camera_frame";
import type { SceneState } from "./scene_state";

/** ⭐ The follower draws here (far out): the switch on, no tilt nor its latch, the square camera's share 0, no timed turn, a direction asked. */
export function followActive(st: SceneState): boolean {
  const sq = st.asmSquare;
  return st.cfg.cameraFollower === 1 && st.asmAsk !== null && st.asmTilt === null && !st.asmTiltAuto && !(sq.n !== null && sq.q > 0) && st.asmZoneMix === null;
}

/**
 * ⭐⭐⭐ (F2) ONE FRAME AT THE CAMERA'S STAGE: `null` where the follower does not draw (its state dropped: it restarts at rest when far begins again); else the
 * pose drawn (the camera's `eye`, `look`, world `up`) and the piece moved onto the followed direction (`st.pieceAnchor`, `st.asmPieceDrawn`). The logic's
 * own pose (`eye`, `look`, `up`, the piece `pp`) is kept as the record's ghost.
 */
export function followFrame(
  st: SceneState,
  pp: Vec3,
  foot: Vec3,
  eye: Vec3,
  look: Vec3,
  up: Vec3,
  gapM: number,
  off: { readonly yawRad: number; readonly pitchRad: number },
  dtMs: number,
): { readonly eye: Vec3; readonly look: Vec3; readonly up: Vec3 } | null {
  const was = st.asmFollow;
  if (!followActive(st) || st.orbitPiecePlaced) {
    st.asmFollow = was === null ? null : { state: null, piece: null, rec: { on: 0 } };
    return null;
  }
  // a change of frame asked: applied at once, the dy hold the logic's crossing's (OP8)
  const ask = st.asmChange;
  if (ask !== null) changeApply(st, ask, false, ask.hold !== undefined ? holdAtCrossing(ask.hold) : undefined);
  st.asmFingerDxMm = 0; // the carried up's dx budget: none far out (read again from 0 when it draws)
  st.asmCarriedYaw = null;
  const hang = Math.hypot(pp[0] - foot[0], pp[1] - foot[1], pp[2] - foot[2]);
  const s0: FollowState = was?.state ?? followStart(hang > 1e-9 ? [(pp[0] - foot[0]) / hang, (pp[1] - foot[1]) / hang, (pp[2] - foot[2]) / hang] : st.asmAsk!);
  const k = { tauMs: st.cfg.followMs, poleDeg: st.cfg.followPoleDeg, fromDeg: st.cfg.followFromDeg, maxDegS: st.cfg.followMaxDegS };
  const s = followStep(s0, st.asmAsk!, dtMs, k);
  const P = followPose(s.dir, look, foot, hang, gapM, off.yawRad, off.pitchRad);
  const prev = was?.piece ?? null;
  st.pieceFrameStepM = prev === null ? 0 : Math.hypot(P.piece[0] - prev[0], P.piece[1] - prev[1], P.piece[2] - prev[2]);
  st.pieceAnchor = P.piece;
  st.asmPieceDrawn = [P.piece[0], P.piece[1], P.piece[2]];
  const view: Vec3 = [P.look[0] - P.eye[0], P.look[1] - P.eye[1], P.look[2] - P.eye[2]];
  const upD = upSquareToView(P.up, view);
  const lv = Math.hypot(view[0], view[1], view[2]);
  if (lv > 1e-12) st.asmCamLast = { dir: [-view[0] / lv, -view[1] / lv, -view[2] / lv], up: upD };
  const g = { gap: 0, speed: 0 };
  const ghost = { eye, look, up: upSquareToView(up, [look[0] - eye[0], look[1] - eye[1], look[2] - eye[2]]) };
  st.asmRollShadow = { ghost, dir: s.dir, piece: P.piece, held: g, free: g, turn: null, turnTw: 0, stays: false, tw: 0, gizmoFree: true, spit: spitZone(st) !== null, freshTurn: false, picture: { eye: P.eye, look: P.look, up: upD }, a2: 0, drawn: true, freed: 0 };
  st.asmFollow = { state: s, piece: P.piece, rec: { on: 1, d: s.dir, sd: s.d, psi: s.psi, side: s.det.side, det: s.det.on ? 1 : 0, pace: s.pace, hang } };
  return { eye: P.eye, look: P.look, up: P.up };
}
