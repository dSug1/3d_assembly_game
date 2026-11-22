/**
 * ⭐⭐⭐ (2026-11-18, `Claude/40_RENDER_SCENE/spec/FAST_ORBIT.md` §12, §14 — package FO3) THE CLOSE DRAWER at the camera's stage (`rollPictureFrame`): the
 * logic's pose (THE GHOST) turned about the framed line through the piece and its look point — the carried up (`carriedFrame`), and its record
 * `st.asmRollShadow` (read by the recorders: `turn_rec.mjs`, `fast_walk_check.mjs`, `hand_replay.mjs` — the field's name kept for them).
 * ⛔ (2026-11-22, `PICTURE_REBUILD.md` §8.6 — R6) the shadow (`rollShadowFrame`, `freeTurnMaxDeg` 0), FO3 S1's gap (`uprightPicture` 0: the roll
 * follower, `roll_follow.followStep`) and law U (`uprightPictureFrame`, `uprightCarried` 0; `uprightCloseIn` 1) deleted: the game no longer took them.
 */
import type { Vec3 } from "../core/vec";
import { rotateAbout, squareTurning, type CamFrame, type CamPose } from "../input/orbit_tilt";
import { framedLine, onGlass, poseRolled, twistAbout } from "../input/roll_follow";
import { askedTwist, CARRIED_REST, framedPose, framingFrom, framingStep, upCarried } from "../input/upright";
import { orbitPoleAxis, spitZone, zoneMixCam, zoneMixPose, type PictureEvents } from "./assembly_wiring";
import type { SceneState } from "./scene_state";

/**
 * ⭐⭐⭐ (2026-11-21, `PICTURE_REBUILD.md` §4.4 — R3b, D-P6) WHAT A DRAWER HANDS BACK: the pose, the camera frame it draws (`cam` — published as `asmCamDrawn` by
 * the picture only; `null`: none of its own, the logic's frame is the one drawn) and the facts the logic reads (`ev`: the holds' events). ⛔ No drawer
 * writes the logic's state any more (`asmCamLast`, `asmEdgeHold`; `asmChange` resolved in `picture_wiring.ts`, the one resolver).
 */
export interface DrawnPose extends CamPose {
  readonly cam: CamFrame | null;
  readonly ev: PictureEvents;
}

/** ⭐⭐⭐ (R3b) A change of frame as the one resolver left it for the close drawer (`changeResolve`): applied at once (`change`), the crossing's dy, the angle freed. */
export interface ChangeLeft {
  readonly change: boolean;
  readonly crossed?: 1 | -1 | 0;
  readonly freed: number;
}

export const CHANGE_NONE: ChangeLeft = { change: false, freed: 0 };

const NO_EVENTS: PictureEvents = {};

/** the camera frame `zoneMixPose` drew (its turn's) — `null`: no turn, the pose as given */
function zoneCam(zmOn: boolean, pose: CamPose): CamFrame | null {
  return zmOn ? zoneMixCam(pose) : null;
}

/** ⭐ A2's error: the piece's (and on the line the look point's) places on the glass, `b` against `a` (half-glasses). */
function placeError(st: SceneState, a: CamPose, b: CamPose, piece: Vec3, line: { readonly throughLook: boolean }): number {
  if (a === b) return 0;
  const fov = st.camera.fov;
  const asp = st.camera.getEngine().getAspectRatio(st.camera);
  let e = 0;
  for (const p of line.throughLook ? [piece, a.look] : [piece]) {
    const x = onGlass(a, p, fov, asp);
    const y = onGlass(b, p, fov, asp);
    e = Math.max(e, Math.hypot(x[0] - y[0], x[1] - y[1]));
  }
  return e;
}

/**
 * ⭐⭐⭐ (2026-11-18, `FAST_ORBIT.md` §12.4, §14 — FO3 S1) ONE FRAME OF THE PICTURE DRAWN by the close drawer, at the camera's stage (`eye`, `look`, `up`: the
 * pose the logic asks for — THE GHOST; `piece`: where the piece is drawn; `left`: the change asked as the one resolver left it, `changeResolve`). Returns
 * the pose to draw, its frame (`cam`, published as `asmCamDrawn` by the picture) and the facts the logic reads (`ev`).
 * ⛔ (R6) the shadow and FO3 S1's gap (the free turn dropped at its first frame, the roll follower `rollFollowMs`) deleted, and law U.
 */
export function rollPictureFrame(st: SceneState, piece: Vec3, eye: Vec3, look: Vec3, up: Vec3, dtMs: number, left: ChangeLeft = CHANGE_NONE): DrawnPose {
  const sq = squareTurning(st.asmSquare.n, st.asmSquare.target, st.asmSquare.q);
  const tl = st.asmTilt;
  const tiltHold = tl !== null && (tl.exit || tl.off);
  // ⭐⭐⭐ (2026-11-20, `UPRIGHT_CARRIED_UP.md` — packet E) ONE CARRIED UP (`carriedFrame`) — ⛔ (R6) law U (`uprightPictureFrame`, `uprightCarried` 0) deleted
  return carriedFrame(st, piece, eye, look, up, dtMs, sq, tiltHold, left);
}

/**
 * ⭐⭐⭐ (2026-11-20, `UPRIGHT_CARRIED_UP.md` §4 — packet E, `uprightCarried` 1) ONE CARRIED UP, at the camera's stage: the picture is the logic's pose `G` turned by
 * `φ` about the framed line, drawn AND read (one glass: `asmCamDrawn` — R3b —, the silent entry, the finger — the finger as it is), and ONE owner
 * turns its up (`upCarried`). FIRST the change asked this frame resolved ONCE (`changeSeen`) by who owns the roll — the square camera's complement `κ` (one
 * pose's OP2): far out applied at once, close in a timed turn as today. Then `G` (`zoneMixPose`), the turn the finger ASKED (C1, `askedTwist`: the drawn
 * orbit's yaw step about its pole axis, none across a change of the logic's frame), the dx's budget (C4), `upCarried`, `P`. C6: at a change applied at
 * once the push held from the same answer (`carriedHold`: the dy as OP8; a dx only when a half turn opened); the gizmo still meanwhile (C7, the spring).
 */
function carriedFrame(st: SceneState, piece: Vec3, eye: Vec3, look: Vec3, up: Vec3, dtMs: number, sqTurning: boolean, tiltHold: boolean, left: ChangeLeft): DrawnPose {
  const was = st.asmRollShadow;
  const sq = st.asmSquare;
  const share = sq.n === null || !(sq.q > 0) ? 0 : sq.q;
  const kappa = 1 - share;
  const knobs = { fromDeg: st.cfg.uprightFromDeg, fullDeg: st.cfg.uprightFullDeg, maxDegS: st.cfg.uprightMaxDegS, alignDegPerMm: st.cfg.uprightAlignDegPerMm, halfHold: st.cfg.uprightHalfHold === 1 };
  // ⭐⭐⭐ (R3b) the change asked resolved ONCE before (`changeResolve`, `picture_wiring.ts` — the carried up's rule moved there as written)
  const { freed, change, crossed } = left;
  const zm = st.asmZoneMix;
  const fresh = zm !== null && zm !== was?.turn;
  const gizmoFree = zm === null && !sqTurning && !tiltHold;
  const zmOn = st.asmZoneMix !== null;
  const G = zoneMixPose(st, piece, eye, look, up);
  const line = framedLine(G, piece);
  const tw = was === null ? 0 : twistAbout(was.ghost, G, line.dir);
  // C1 THE TURN ASKED: the drawn orbit's yaw step about its pole axis, the upright camera's away from the vertical — none across a change of the logic's frame
  const q = st.pieceQ ?? st.boxOrbit ?? { yaw: st.orbit.yaw, v: st.orbit.elevation };
  const cy = st.asmCarriedYaw;
  const tiltId = st.asmTilt !== null ? st.asmTilt.id : 0;
  const same = cy !== null && cy.zone === st.asmZone && cy.tilt === tiltId && !change && was !== null;
  const dYaw = same ? Math.atan2(Math.sin(q.yaw - cy.yaw), Math.cos(q.yaw - cy.yaw)) : 0;
  const asked = same ? askedTwist(was.ghost, G, line.dir, orbitPoleAxis(st), dYaw) : 0;
  st.asmCarriedYaw = { yaw: q.yaw, zone: st.asmZone, tilt: tiltId };
  // C4 the dx's budget this frame (mm), read once
  const dxMm = st.asmFingerDxMm;
  st.asmFingerDxMm = 0;
  const r = upCarried(was?.one?.state ?? CARRIED_REST, G, line, dtMs, knobs, kappa, change, asked, dxMm);
  const P = poseRolled(G, line, r.phi);
  // ⭐⭐⭐ (2026-11-20, `UPRIGHT_CARRIED_UP.md` §8 — packet J) THE FRAMING CARRIED FROM THE POSE SHOWN (⛔ R6: its switch `uprightFraming`, 0 = `P`, deleted):
  // a change applied at once draws from the picture shown (turned back by φ about the framed line), the piece and the aim carried straight on the glass
  // to where the logic frames them, over the change's own time at the half turn's pace (`framingStep`, `framedPose`) — the pose drawn only: φ, the half
  // turn, the holds as they are. ⛔ (`28a29ca`) the carry took back the change's roll alone: the piece leapt to where the new pose frames it, in one frame
  const shown = change && was !== null && was.one !== undefined && was.picture ? framingFrom(was.picture, was.piece, line, r.phi) : null;
  const ft = framingStep(was?.one?.framing ?? null, change, shown, freed, r.halfStart, dtMs, st.cfg.uprightMaxDegS, kappa);
  const fd = ft === null ? null : framedPose(ft, G, piece, st.asmTiltAuto, st.cfg.pictureOne); // ⭐⭐⭐ (R2) born close in: about the piece (`turnPose`)
  const D = fd === null ? P : poseRolled(fd.pose, line, r.phi);
  // ⭐⭐⭐ (R3b) published: the logic's own hold code writes it (`pictureEventsRead`: `carriedHold`)
  const ev: PictureEvents = change && crossed !== undefined ? { carried: { halfStart: r.halfStart, crossed } } : NO_EVENTS;
  const d: Vec3 = [D.eye[0] - D.look[0], D.eye[1] - D.look[1], D.eye[2] - D.look[2]];
  const l = Math.hypot(d[0], d[1], d[2]);
  const cam: CamFrame | null = l > 1e-12 ? { dir: [d[0] / l, d[1] / l, d[2] / l], up: D.up } : zoneCam(zmOn, G);
  const sp = st.asmSpitPic;
  if (sp !== null && r.phi !== 0) {
    const u2 = rotateAbout(sp.up, line.dir, r.phi);
    const k = u2[0] * sp.u[0] + u2[1] * sp.u[1] + u2[2] * sp.u[2];
    const v: Vec3 = [u2[0] - k * sp.u[0], u2[1] - k * sp.u[1], u2[2] - k * sp.u[2]];
    const lv = Math.hypot(v[0], v[1], v[2]);
    if (lv > 1e-9) st.asmSpitPic = { u: sp.u, up: [v[0] / lv, v[1] / lv, v[2] / lv] };
  }
  const turnTw = fresh ? tw : (was?.turnTw ?? 0);
  const g = { gap: r.phi, speed: 0 };
  st.asmRollShadow = { ghost: G, dir: line.dir, piece, held: g, free: g, turn: zm, turnTw, stays: zm !== null, tw, gizmoFree, spit: spitZone(st) !== null, freshTurn: fresh, picture: D, a2: placeError(st, G, D, piece, line), drawn: true, freed, one: { state: r.state, w: r.w, phi: r.phi, kappa, halfStart: r.halfStart, holding: r.holding, change, framing: fd === null ? null : fd.turn } };
  return { eye: D.eye, look: D.look, up: D.up, cam, ev };
}
