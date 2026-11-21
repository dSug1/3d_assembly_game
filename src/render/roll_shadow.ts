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
 *
 * ⭐⭐⭐ (2026-11-18, `FAST_ORBIT.md` §14 — FO3 S1) THE PICTURE DRAWN (`rollPictureFrame`, `freeTurnMaxDeg` over 0; 0: the shadow above and today's
 * `zoneMixPose`, nothing else runs — R10).
 */
import type { Vec3 } from "../core/vec";
import { upSquareToView } from "../input/camera_frame";
import { rotateAbout, squareTurning, type CamFrame, type CamPose } from "../input/orbit_tilt";
import { followStep, FREE_TURN_MAX_DEG, framedLine, GAP_ZERO, onGlass, poseRolled, poseTurnAngle, ROLL_FOLLOW_MS, turnIsFree, twistAbout, type FollowMode } from "../input/roll_follow";
import { easeRest } from "../input/seam_turn";
import { askedTwist, CARRIED_REST, framedPose, framingFrom, framingStep, upCarried, UPRIGHT_REST, uprightStep } from "../input/upright";
import { orbitPoleAxis, spitZone, zoneMixCam, zoneMixPose, type PictureEvents } from "./assembly_wiring";
import type { SceneState } from "./scene_state";

const DEG = Math.PI / 180;

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
  st.asmRollShadow = { ghost, dir: line.dir, piece, held, free: fr, turn, turnTw, stays, tw, gizmoFree: free, spit: spitZone(st) !== null, freshTurn: fresh, picture, a2, drawn: false, freed: 0 };
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

/** a token: the piece's shown direction's ease no turn carries (`asmDirEase.own` — its `mix` never a turn) */
const OWN_CLOCK: object = Object.freeze({ own: true });

/**
 * ⭐⭐⭐ (2026-11-18, `FAST_ORBIT.md` §12.4, §14 — FO3 S1) ONE FRAME OF THE PICTURE DRAWN, at the camera's stage (`eye`, `look`, `up`: the pose the logic
 * asks for — THE GHOST; `piece`: where the piece is drawn). Returns the pose to draw.
 * * `freeTurnMaxDeg` 0: the shadow (S0's, recorded) and today's `zoneMixPose` — nothing of this path runs (R10, A0).
 * * A change of frame's timed turn, at its first frame (`asmZoneMix` new), is MADE FREE (dropped: the gizmo never held by it, O2) when its whole angle —
 *   last frame's ghost to this one's (`poseTurnAngle`) — is under `freeTurnMaxDeg` (`turnIsFree`, its tolerance), and it is none of the kinds that stay
 *   (§13.7 (d): paced `byMm`, the way out `out`, a tilt's `tilt`; the square camera turning, a tilt's exit asked — `tiltHold`; a turn that stays still
 *   drawn last frame — a new one replaces it from the pose shown, as today). The piece's shown direction's ease on that turn goes on on a clock of its
 *   own (`asmDirEase.own`, O3).
 * * THE GAP (`followStep`, `rollFollowMs`): it TAKES the ghost's twist about the framed line while the gizmo is free; a turn that stays drawn: 0 (it starts
 *   from the pose shown — the picture —, O5); the frame after it ends, and the first frame: 0; the square camera turning or a tilt's exit asked (no zone
 *   turn): the twist not taken, the gap closing (§12.4 2.).
 * * THE PICTURE: the ghost turned about the framed line by the gap (`poseRolled`) — the piece and the look point exact on the glass (R3); gap 0: the
 *   pose as given, bit for bit (R5). Its frame handed back (`cam`, published as `asmCamDrawn` — the finger in a spit read off it, R7).
 */
export function rollPictureFrame(st: SceneState, piece: Vec3, eye: Vec3, look: Vec3, up: Vec3, dtMs: number, left: ChangeLeft = CHANGE_NONE): DrawnPose {
  const maxDeg = st.cfg.freeTurnMaxDeg;
  if (!(maxDeg > 0)) {
    rollShadowFrame(st, piece, { eye, look, up }, dtMs);
    const zmOn = st.asmZoneMix !== null;
    const zp0 = zoneMixPose(st, piece, eye, look, up);
    return { eye: zp0.eye, look: zp0.look, up: zp0.up, cam: zoneCam(zmOn, zp0), ev: NO_EVENTS };
  }
  const view: Vec3 = [look[0] - eye[0], look[1] - eye[1], look[2] - eye[2]];
  const ghost: CamPose = { eye, look, up: upSquareToView(up, view) };
  const line = framedLine(ghost, piece);
  const was = st.asmRollShadow;
  const sq = squareTurning(st.asmSquare.n, st.asmSquare.target, st.asmSquare.q);
  const tl = st.asmTilt;
  const tiltHold = tl !== null && (tl.exit || tl.off);
  // ⭐⭐⭐ (2026-11-19, `UPRIGHT_PICTURE.md` §12 RB1) law U decides each change ONCE (`changeSeen`, in `uprightPictureFrame`): nothing below runs for it
  // ⭐⭐⭐ (2026-11-20, `UPRIGHT_CARRIED_UP.md` — packet E) ONE CARRIED UP (`carriedFrame`); 0: law U (`1f62928`)
  if (st.cfg.uprightPicture === 1 && st.cfg.uprightCarried === 1) return carriedFrame(st, piece, eye, look, up, dtMs, sq, tiltHold, left);
  if (st.cfg.uprightPicture === 1) return uprightPictureFrame(st, piece, eye, look, up, dtMs, sq, tiltHold, left);
  let zm = st.asmZoneMix;
  const fresh = zm !== null && zm !== was?.turn;
  let freed = 0;
  if (zm !== null && fresh && was !== null && was.drawn && was.turn === null && zm.byMm !== true && zm.out === undefined && zm.tilt !== true && !sq && !tiltHold) {
    const whole = poseTurnAngle(was.ghost, ghost);
    if (turnIsFree(whole, maxDeg)) {
      // O3: the piece's shown direction's ease on this turn — its rest — on a clock of its own
      const e = st.asmDirEase;
      if (e !== null && e.mix === zm) {
        const rest = easeRest(e, zm.k);
        st.asmDirEase = rest === null ? null : { axis: rest.axis, angle: rest.angle, mix: OWN_CLOCK, own: { gap: rest.angle, speed: 0 } };
      }
      st.asmZoneMix = null;
      zm = null;
      freed = whole > 0 ? whole : Number.MIN_VALUE;
    }
  }
  const tw = was === null ? 0 : twistAbout(was.ghost, ghost, line.dir);
  const gizmoFree = zm === null && !sq && !tiltHold;
  const afterStay = was !== null && was.turn !== null && zm === null;
  const mode: FollowMode = was === null || !was.drawn || was.upright !== undefined || zm !== null || afterStay ? "ZERO" : gizmoFree ? "TAKE" : "SKIP";
  const g = followStep(was?.free ?? GAP_ZERO, tw, dtMs, st.cfg.rollFollowMs, mode);
  const zmOn = st.asmZoneMix !== null;
  const zp = zoneMixPose(st, piece, eye, look, up);
  let pose = zp;
  let picture = ghost;
  let cam = zoneCam(zmOn, zp);
  if (zm === null && g.gap !== 0) {
    picture = poseRolled(ghost, line, g.gap);
    pose = picture;
    const d: Vec3 = [picture.eye[0] - picture.look[0], picture.eye[1] - picture.look[1], picture.eye[2] - picture.look[2]];
    const l = Math.hypot(d[0], d[1], d[2]);
    cam = { dir: [d[0] / l, d[1] / l, d[2] / l], up: picture.up };
  }
  const turnTw = fresh ? tw : (was?.turnTw ?? 0);
  st.asmRollShadow = { ghost, dir: line.dir, piece, held: g, free: g, turn: zm, turnTw, stays: zm !== null, tw, gizmoFree, spit: spitZone(st) !== null, freshTurn: fresh, picture, a2: placeError(st, ghost, picture, piece, line), drawn: true, freed };
  return { eye: pose.eye, look: pose.look, up: pose.up, cam, ev: NO_EVENTS };
}

/**
 * ⭐⭐⭐ (2026-11-18, `UPRIGHT_PICTURE.md` §2 steps 3 – 4 — law U, `uprightPicture` 1) ONE FRAME OF THE UPRIGHT PICTURE, at the camera's stage: `G` the logic's
 * pose (`zoneMixPose`: the ghost, or a timed turn's pose where a turn stays — FO3's gap NOT applied, UD4); `φ` from law U (`uprightStep`: the turn about
 * the framed line that puts gravity on the glass's vertical, weighted by the view's angle from the vertical and the square camera's complement — UD3,
 * `uprightCloseIn` 0); the picture `P = poseRolled(G, L, φ)` — the piece and the look point exact on the glass; `φ` 0: `G` itself. `asmCamLast` (R3b: `asmCamLogic`) stays
 * the logic's (`zoneMixPose` wrote it); the record in `st.asmRollShadow` (`ghost` = `G`).
 * ⭐⭐⭐ (2026-11-19, §12 RB1 — the rebuild) FIRST, the change of frame ASKED this frame (`asmChange`, by `turnBegin`) resolved ONCE (`changeSeen`): its angle
 * the logic's pose last frame to this frame's (`ghost`, before any turn), `w` before it the picture's last frame, after it this ghost's; a timed turn or at
 * once (`changeApply`) — never a turn made and then deleted (⛔ `uprightFrees`, fix rounds 0 – 3). At once: the law's carry WHOLE on this frame (the logic's
 * twist about the framed line undone — UD4b's rule, now a property of the decision). ⛔ (fix round 1, F3) the carry whole on a timed turn's first frame too:
 * measured inert (the logic's twist 0 on all 141 such frames), removed.
 */
function uprightPictureFrame(st: SceneState, piece: Vec3, eye: Vec3, look: Vec3, up: Vec3, dtMs: number, sqTurning: boolean, tiltHold: boolean, left: ChangeLeft): DrawnPose {
  const was = st.asmRollShadow;
  const sq = st.asmSquare;
  const share = sq.n === null || !(sq.q > 0) ? 0 : sq.q;
  const scale = st.cfg.uprightCloseIn === 1 ? 1 : 1 - share;
  const knobs = { fromDeg: st.cfg.uprightFromDeg, fullDeg: st.cfg.uprightFullDeg, maxDegS: st.cfg.uprightMaxDegS };
  // ⭐⭐⭐ (R3b) the change asked resolved ONCE before (`changeResolve`, `picture_wiring.ts` — law U's rule moved there as written): the angle it freed
  const freed = left.freed;
  const zm = st.asmZoneMix;
  const fresh = zm !== null && zm !== was?.turn;
  const gizmoFree = zm === null && !sqTurning && !tiltHold;
  const zmOn = st.asmZoneMix !== null;
  const G = zoneMixPose(st, piece, eye, look, up);
  const line = framedLine(G, piece);
  const tw = was === null ? 0 : twistAbout(was.ghost, G, line.dir);
  // ⭐⭐⭐ (fix round 3, §10 UD6c) the carry is the logic's twist undone, in the law (`uprightStep`): WHOLE on a change applied at once, else `min(w, w before)`
  const r = uprightStep(was?.upright?.state ?? UPRIGHT_REST, G, line, dtMs, knobs, scale, freed > 0);
  const P = poseRolled(G, line, r.phi);
  // ⭐⭐⭐ (2026-11-19, §12 RB3) THE LAW'S OWN HALF TURN is a turn he sees: the gizmo held while it closes (`lawHalfTurn`, T5's reader) and the push that was on
  // held after it — as any seen turn's (`holdSeen`, last frame's picture: the glass the push was made on); a hold already on (the change's) kept
  // ⭐⭐⭐ (R3b) published: the logic's own hold code writes it (`pictureEventsRead`)
  const ev: PictureEvents = r.halfStart > 0 && was !== null ? { lawHalf: { rad: r.halfStart, picture: was.picture, ghost: was.ghost } } : NO_EVENTS;
  const turnTw = fresh ? tw : (was?.turnTw ?? 0);
  const g = { gap: r.phi, speed: 0 };
  st.asmRollShadow = { ghost: G, dir: line.dir, piece, held: g, free: g, turn: zm, turnTw, stays: zm !== null, tw, gizmoFree, spit: spitZone(st) !== null, freshTurn: fresh, picture: P, a2: placeError(st, G, P, piece, line), drawn: true, freed, upright: { state: r.state, w: r.w, phi: r.phi } };
  return { eye: P.eye, look: P.look, up: P.up, cam: zoneCam(zmOn, G), ev };
}

/**
 * ⭐⭐⭐ (2026-11-20, `UPRIGHT_CARRIED_UP.md` §4 — packet E, `uprightCarried` 1) ONE CARRIED UP, at the camera's stage: the picture is the logic's pose `G` turned by
 * `φ` about the framed line, drawn AND read (one glass: `asmCamDrawn` — R3b —, the silent entry, the finger — `fingerAtEntry` reads law U's record only), and ONE owner
 * turns its up (`upCarried`). FIRST the change asked this frame resolved ONCE (`changeSeen`) by who owns the roll — the square camera's complement `κ` (one
 * pose's OP2): far out applied at once, close in a timed turn as today. Then `G` (`zoneMixPose`), the turn the finger ASKED (C1, `askedTwist`: the drawn
 * orbit's yaw step about its pole axis, none across a change of the logic's frame), the dx's budget (C4), `upCarried`, `P`. C6: at a change applied at
 * once the push held from the same answer (`carriedHold`: the dy as OP8; a dx only when a half turn opened); the gizmo still meanwhile (C7, the spring).
 */
function carriedFrame(st: SceneState, piece: Vec3, eye: Vec3, look: Vec3, up: Vec3, dtMs: number, sqTurning: boolean, tiltHold: boolean, left: ChangeLeft): DrawnPose {
  const was = st.asmRollShadow;
  const sq = st.asmSquare;
  const share = sq.n === null || !(sq.q > 0) ? 0 : sq.q;
  const kappa = st.cfg.uprightCloseIn === 1 ? 1 : 1 - share;
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
  // ⭐⭐⭐ (2026-11-20, `UPRIGHT_CARRIED_UP.md` §8 — packet J) THE FRAMING CARRIED FROM THE POSE SHOWN (`uprightFraming` 1; 0: the picture `P` as at `28a29ca`):
  // a change applied at once draws from the picture shown (turned back by φ about the framed line), the piece and the aim carried straight on the glass
  // to where the logic frames them, over the change's own time at the half turn's pace (`framingStep`, `framedPose`) — the pose drawn only: φ, the half
  // turn, the holds as they are. ⛔ (`28a29ca`) the carry took back the change's roll alone: the piece leapt to where the new pose frames it, in one frame
  const shown = change && was !== null && was.one !== undefined && was.picture ? framingFrom(was.picture, was.piece, line, r.phi) : null;
  const ft = st.cfg.uprightFraming === 1 ? framingStep(was?.one?.framing ?? null, change, shown, freed, r.halfStart, dtMs, st.cfg.uprightMaxDegS, kappa) : null;
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
