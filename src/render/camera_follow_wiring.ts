/**
 * ⭐⭐⭐ (2026-11-20, `Claude/40_RENDER_SCENE/spec/CAMERA_FOLLOWS_GIZMO.md` §13 — F2) THE CAMERA FOLLOWER AT THE CAMERA'S STAGE, far out: the camera a simple polar
 * orbit (world up) about the orbit's centre, following the direction ASKED (`st.asmAsk`) through ONE ease, round the vertical by place; the piece hung
 * along the SAME followed direction from the gizmo's foot. The rules are pure (`input/camera_follow.ts`); this file holds the state and the call.
 *
 * WHERE FAR ENDS: the follower draws while no tilt is on (`asmTilt`; ⛔ R6: its switch `cameraFollower` deleted), the automatic tilt is not latched (`asmTiltAuto`:
 * the approach within `tiltAutoM`, 0.6 m, of the gizmo; off again beyond 0.65 m), the square camera's share is 0 and no timed turn runs (`asmZoneMix`: the
 * way out of close in). Elsewhere (close in) the live picture (`rollPictureFrame`, the carried up) draws, frame for frame as before; the follower restarts
 * at rest on the piece's drawn direction when far begins again. ⛔ No blend at that boundary yet (F3).
 *
 * Far out, a change of frame the logic asks (`asmChange`) is applied AT ONCE (no timed turn: the follower is the picture's one ease) with the dy hold from
 * the LOGIC's crossing (`holdAtCrossing` — OP8, as `1.0.147-`); no half turn exists, so no gizmo hold (D-F4). Nothing here undoes a turn or a hold.
 *
 * ⭐⭐⭐ (2026-11-20, `CAMERA_FOLLOWS_GIZMO.md` §15 – §16 — H2, `followTop` 1) THE TOP AND BOTTOM FAR OUT: the heading the calm's levelled reading
 * (`st.asmAskLevel`; carried where none), the height capped, at a facet change of the gizmo (`gizmoFacetW`, the MODEL's) the follower's OWN turn — the gizmo
 * waiting meanwhile (`tiltClampStep` reads `asmFollow.top.turn`) — and the dy hold decided there (D-H8: a turn over 90° the dy made), published (R3b) for
 * the logic to write through `holdAtCrossing` (`pictureEventsRead`); the logic's own `ask.hold` is not written far out (R4 amended). ⛔ (2026-11-22,
 * `PICTURE_REBUILD.md` §8.6 — R6) its 0 (the follower as `de4a10e`, the detour) deleted with its switch.
 *
 * ⭐⭐⭐ (2026-11-21, `CAMERA_FOLLOWS_GIZMO.md` §17.3 – §18 — H3) THE FIX ROUND (⛔ R6: its three switches and their 0 — `ba369aa` — deleted): F-1 a turn
 * only where the levelled reading itself jumps; F-2 the turn at his finger's pace (`asmFrameMm`), clamped by `followTurnMaxDegS`; F-3 a turn started sets
 * every angle state to the map's place at the gizmo (`seamRebase`).
 */
import type { Vec3 } from "../core/vec";
import { followFarStep, followPose, followStart, followTopStep, type FollowState, type FollowTop } from "../input/camera_follow";
import { tiltDir, type CamFrame } from "../input/orbit_tilt";
import { approachDistance, closeInGain, orbitDir } from "../input/assembly_orbit";
import { orbitDegPerMm } from "../input/follow_camera";
import { dirFrame, farAskedWhereHeld, farTopDecided, followRebaseAsked, gizmoFacetW, spitZone, type PictureEvents } from "./assembly_wiring";
import { upSquareToView } from "../input/camera_frame";
import type { SceneState } from "./scene_state";

/** ⭐⭐⭐ (R3a) The one picture's hook far out: the follower's pose at its own direction `dFar` → the pose drawn (`picture_wiring.ts`, `pictureStep`). */
export type FollowPicture = (P: { readonly eye: Vec3; readonly look: Vec3; readonly up: Vec3; readonly piece: Vec3 }, dFar: Vec3, hang: number, us: Vec3) => { readonly eye: Vec3; readonly look: Vec3; readonly up: Vec3; readonly piece: Vec3 };

/** ⭐ The follower draws here (far out): no tilt nor its latch, the square camera's share 0, no timed turn, a direction asked. */
export function followActive(st: SceneState): boolean {
  const sq = st.asmSquare;
  return st.asmAsk !== null && st.asmTilt === null && !st.asmTiltAuto && !(sq.n !== null && sq.q > 0) && st.asmZoneMix === null;
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
  pic: FollowPicture,
  also: boolean,
): { readonly eye: Vec3; readonly look: Vec3; readonly up: Vec3; readonly cam: CamFrame | null; readonly ev: PictureEvents } | null {
  const was = st.asmFollow;
  // ⭐⭐⭐ (2026-11-21 night, `PICTURE_REBUILD.md` §4.3a rule 4 — R3-FIX, the lead's amendment) `also`: the one picture's far path while a logic turn runs (the
  // close drawer ran this frame for the LOGIC — its clocks, its state, its record — not drawn): the follower draws anyway, its state run on, never parked;
  // the close drawer's own (the carried up's dx budget and yaw, the record `asmRollShadow`) left as that drawer wrote them
  if ((also !== true && !followActive(st)) || st.orbitPiecePlaced) {
    // ⭐⭐⭐ (R3a) the picture keeps the state (parked at rest on its target: `picture_wiring.ts`) — never dropped (⛔ R6: today's line's drop deleted)
    return null;
  }
  // ⭐⭐⭐ (2026-11-21, R3b) a change of frame asked is resolved ONCE before this (`changeResolve`, `picture_wiring.ts`: here at once, the dy hold the logic's
  // crossing's — OP8; under the top's rule none: a hold far out only after the follower's own half turn, R4 amended, D-H8)
  if (also !== true) {
    st.asmFingerDxMm = 0; // the carried up's dx budget: none far out (read again from 0 when it draws)
    st.asmCarriedYaw = null;
  }
  const hang = Math.hypot(pp[0] - foot[0], pp[1] - foot[1], pp[2] - foot[2]);
  const s0: FollowState = was?.state ?? followStart(hang > 1e-9 ? [(pp[0] - foot[0]) / hang, (pp[1] - foot[1]) / hang, (pp[2] - foot[2]) / hang] : st.asmAsk!);
  let s: FollowState;
  let topS: FollowTop | null = null;
  let topRec: Record<string, unknown> | null = null;
  let ev: PictureEvents = {};
  // ⭐⭐⭐ (H2) the top's rule: his pace read on the orbit's own direction in the world (the finger's place), the gizmo's facet, the glass's up drawn last
  // ⭐⭐⭐ (H3, `CAMERA_FOLLOWS_GIZMO.md` §17.3) F-1 a turn only on the reading's own jump; F-2 his FINGER's pace — this frame's deadbanded travel × the
  // orbit's own degrees per mm (the drag's `gainOrbitYaw` × `boxGainYaw` × `closeInGain`, whole far out) — and the clamp (⛔ R6: H2's, the switches 0, deleted)
  const dpm = orbitDegPerMm(st.cfg, st.orbit.elevation).yawDegPerMm;
  const degPerMm = dpm * closeInGain(approachDistance(st.cfg, st.approach), st.cfg.orbitGainFullM, st.cfg.orbitContactMmPerMm, dpm, st.asm?.radius ?? 0);
  const kt = { tauMs: st.cfg.followMs, poleDeg: st.cfg.followPoleDeg, minDeg: st.cfg.followTurnMinDeg, rollDegS: st.cfg.tiltRollDegS, paceShare: st.cfg.followTurnPace, degPerMm, maxDegS: st.cfg.followTurnMaxDegS, leashPace: st.cfg.followLeashPace === 1 };
  const orbitW = tiltDir(dirFrame(st), orbitDir(st.orbit.yaw, st.orbit.elevation));
  // ⭐⭐⭐ (2026-11-21, R5 — `TOP_BOTTOM_STUDY.md` §3, §6) under the far rule as decided (`farTopDecided`: `pictureFarTop` 1) `followFarStep`: the far reading
  // (D-H19, `asmAskLevel`), its jump by GEOMETRY (D-H15: last frame's calm at these angles, `asmAskLevelWas`), the dy hold on the up HE sees (D-H16: the
  // picture's own frame drawn last frame, `asmCamDrawn` — ⛔ `asmCamLogic`, the logic's, written this frame just before); else H2 / H3 exactly
  // ⭐⭐⭐ (2026-11-22, `CAMERA_FOLLOWS_GIZMO.md` §19, D-H20 — `followTurnAtGizmo` 1) the far reading where the gizmo will wait if a turn starts (F-3's place)
  const psiLAt = farTopDecided(st) && st.cfg.followTurnAtGizmo === 1 ? farAskedWhereHeld(st) : undefined;
  const r = farTopDecided(st)
    ? followFarStep(s0, was?.top ?? null, { ask: st.asmAsk!, orbit: orbitW, psiL: st.asmAskLevel, nW: gizmoFacetW(st), upShown: st.asmCamDrawn?.up ?? null, dySign: st.asmDySign, fingerMm: st.asmFrameMm, ...(st.asmAskLevelWas !== null ? { psiLWas: st.asmAskLevelWas.psi } : {}), ...(st.asmJumpAt !== null ? { jumpAt: st.asmJumpAt } : {}), ...(psiLAt !== undefined ? { psiLAt } : {}) }, dtMs, kt)
    : followTopStep(s0, was?.top ?? null, { ask: st.asmAsk!, orbit: orbitW, psiL: st.asmAskLevel, nW: gizmoFacetW(st), upShown: st.asmCamLogic?.up ?? null, dySign: st.asmDySign, fingerMm: st.asmFrameMm }, dtMs, kt);
  s = r.s;
  topS = r.top;
  // ⭐⭐⭐ (D-H8 = D-T4) the dy hold decided at the follower's own crossing: it REPLACES any hold still on (a 0 writes none — `holdAtCrossing`)
  // ⭐⭐⭐ (H3, F-3 = D-H11) A TURN STARTED: every angle state SET to the map's place at the gizmo (`seamRebase`, the charts' 2.4c rule — the place
  // shown, in the map's own frame), so while the gizmo waits nothing catches up and it does not travel (⛔ the orbit's angles held alone: the map's
  // catch-up carried the gizmo up to three facets on — root (c)); the follower's spring stands between those angles and the camera
  // ⭐⭐⭐ (2026-11-21, R3b, D-P6) both PUBLISHED (the turn's start event): the logic's own code writes them (`pictureEventsRead`), right after the picture
  ev = { followStarted: r.started, ...(r.hold !== undefined ? { followHold: r.hold } : {}) };
  const rb = followRebaseAsked(st, r.started);
  const t = topS.turn;
  topRec = { L: st.asmAskLevel, T: topS.psiT, k: t === null ? -1 : t.k, dl: t === null ? null : t.delta, dur: t === null ? 0 : t.durMs, x: r.delta, h: r.hold ?? null, p: topS.pace, s: r.started ? 1 : 0, rb: rb ? 1 : 0, ...(psiLAt !== undefined ? { A: psiLAt } : {}) };
  const P0 = followPose(s.dir, look, foot, hang, gapM, off.yawRad, off.pitchRad);
  // ⭐⭐⭐ (R3a) THE ONE PICTURE draws (`pictureStep`): w 0 and no up held — `P0` itself, the same objects (far out bit for bit)
  const P = pic(P0, s.dir, hang, hang > 1e-9 ? [(pp[0] - foot[0]) / hang, (pp[1] - foot[1]) / hang, (pp[2] - foot[2]) / hang] : st.asmAsk!);
  const prev = was?.piece ?? null;
  st.pieceFrameStepM = prev === null ? 0 : Math.hypot(P.piece[0] - prev[0], P.piece[1] - prev[1], P.piece[2] - prev[2]);
  st.pieceAnchor = P.piece;
  st.asmPieceDrawn = [P.piece[0], P.piece[1], P.piece[2]];
  const view: Vec3 = [P.look[0] - P.eye[0], P.look[1] - P.eye[1], P.look[2] - P.eye[2]];
  const upD = upSquareToView(P.up, view);
  const lv = Math.hypot(view[0], view[1], view[2]);
  const cam: CamFrame | null = lv > 1e-12 ? { dir: [-view[0] / lv, -view[1] / lv, -view[2] / lv], up: upD } : null; // ⭐ (R3b) published by the picture (`asmCamDrawn`)
  const g = { gap: 0, speed: 0 };
  const ghost = { eye, look, up: upSquareToView(up, [look[0] - eye[0], look[1] - eye[1], look[2] - eye[2]]) };
  if (also !== true) st.asmRollShadow = { ghost, dir: s.dir, piece: P.piece, held: g, free: g, turn: null, turnTw: 0, stays: false, tw: 0, gizmoFree: true, spit: spitZone(st) !== null, freshTurn: false, picture: { eye: P.eye, look: P.look, up: upD }, a2: 0, drawn: true, freed: 0 };
  st.asmFollow = { state: s, piece: P.piece, rec: { on: 1, d: s.dir, sd: s.d, psi: s.psi, side: s.det.side, det: s.det.on ? 1 : 0, pace: s.pace, hang, ...(topRec !== null ? { top: topRec } : {}) }, ...(topS !== null ? { top: topS } : {}) };
  return { eye: P.eye, look: P.look, up: P.up, cam, ev };
}
