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
import { squareTurning, type CamPose } from "../input/orbit_tilt";
import { followStep, FREE_TURN_MAX_DEG, framedLine, GAP_ZERO, onGlass, poseRolled, poseTurnAngle, ROLL_FOLLOW_MS, turnIsFree, twistAbout, type FollowMode } from "../input/roll_follow";
import { easeRest } from "../input/seam_turn";
import { UPRIGHT_REST, uprightHoldKept, uprightStep, uprightWeight, viewFromVertical } from "../input/upright";
import { spitZone, zoneMixPose } from "./assembly_wiring";
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
 *   pose as given, bit for bit (R5). `st.asmCamLast` the picture's (the finger in a spit read off it, R7).
 */
export function rollPictureFrame(st: SceneState, piece: Vec3, eye: Vec3, look: Vec3, up: Vec3, dtMs: number): CamPose {
  const maxDeg = st.cfg.freeTurnMaxDeg;
  if (!(maxDeg > 0)) {
    rollShadowFrame(st, piece, { eye, look, up }, dtMs);
    return zoneMixPose(st, piece, eye, look, up);
  }
  const view: Vec3 = [look[0] - eye[0], look[1] - eye[1], look[2] - eye[2]];
  const ghost: CamPose = { eye, look, up: upSquareToView(up, view) };
  const line = framedLine(ghost, piece);
  const was = st.asmRollShadow;
  const sq = squareTurning(st.asmSquare.n, st.asmSquare.target, st.asmSquare.q);
  const tl = st.asmTilt;
  const tiltHold = tl !== null && (tl.exit || tl.off);
  let zm = st.asmZoneMix;
  const fresh = zm !== null && zm !== was?.turn;
  let freed = 0;
  if (zm !== null && fresh && was !== null && was.drawn && was.turn === null && zm.byMm !== true && zm.out === undefined && zm.tilt !== true && !sq && !tiltHold) {
    const whole = poseTurnAngle(was.ghost, ghost);
    if (st.cfg.uprightPicture === 1 ? uprightFrees(st, was, ghost, whole, maxDeg) : turnIsFree(whole, maxDeg)) {
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
  if (st.cfg.uprightPicture === 1) return uprightPictureFrame(st, piece, eye, look, up, dtMs, zm, fresh, freed, zm === null && !sq && !tiltHold);
  const tw = was === null ? 0 : twistAbout(was.ghost, ghost, line.dir);
  const gizmoFree = zm === null && !sq && !tiltHold;
  const afterStay = was !== null && was.turn !== null && zm === null;
  const mode: FollowMode = was === null || !was.drawn || was.upright !== undefined || zm !== null || afterStay ? "ZERO" : gizmoFree ? "TAKE" : "SKIP";
  const g = followStep(was?.free ?? GAP_ZERO, tw, dtMs, st.cfg.rollFollowMs, mode);
  const zp = zoneMixPose(st, piece, eye, look, up);
  let pose = zp;
  let picture = ghost;
  if (zm === null && g.gap !== 0) {
    picture = poseRolled(ghost, line, g.gap);
    pose = picture;
    const d: Vec3 = [picture.eye[0] - picture.look[0], picture.eye[1] - picture.look[1], picture.eye[2] - picture.look[2]];
    const l = Math.hypot(d[0], d[1], d[2]);
    st.asmCamLast = { dir: [d[0] / l, d[1] / l, d[2] / l], up: picture.up };
  }
  const turnTw = fresh ? tw : (was?.turnTw ?? 0);
  st.asmRollShadow = { ghost, dir: line.dir, piece, held: g, free: g, turn: zm, turnTw, stays: zm !== null, tw, gizmoFree, spit: spitZone(st) !== null, freshTurn: fresh, picture, a2: placeError(st, ghost, picture, piece, line), drawn: true, freed };
  return pose;
}

/**
 * ⭐⭐⭐ (2026-11-18, `UPRIGHT_PICTURE.md` §2 steps 3 – 4 — law U, `uprightPicture` 1) ONE FRAME OF THE UPRIGHT PICTURE, at the camera's stage: `G` the logic's
 * pose (`zoneMixPose`: the ghost, or a timed turn's pose where a turn stays — FO3's gap NOT applied, UD4); `φ` from law U (`uprightStep`: the turn about
 * the framed line that puts gravity on the glass's vertical, weighted by the view's angle from the vertical and the square camera's complement — UD3,
 * `uprightCloseIn` 0); the picture `P = poseRolled(G, L, φ)` — the piece and the look point exact on the glass; `φ` 0: `G` itself. `st.asmCamLast` stays
 * the logic's (`zoneMixPose` wrote it); the record in `st.asmRollShadow` (`ghost` = `G`).
 */
function uprightPictureFrame(st: SceneState, piece: Vec3, eye: Vec3, look: Vec3, up: Vec3, dtMs: number, zm: object | null, fresh: boolean, freed: number, gizmoFree: boolean): CamPose {
  const was = st.asmRollShadow;
  const G = zoneMixPose(st, piece, eye, look, up);
  const line = framedLine(G, piece);
  const sq = st.asmSquare;
  const share = sq.n === null || !(sq.q > 0) ? 0 : sq.q;
  const scale = st.cfg.uprightCloseIn === 1 ? 1 : 1 - share;
  const knobs = { fromDeg: st.cfg.uprightFromDeg, fullDeg: st.cfg.uprightFullDeg, maxDegS: st.cfg.uprightMaxDegS };
  const tw = was === null ? 0 : twistAbout(was.ghost, G, line.dir);
  // ⭐⭐⭐ (§6 UD4b, `uprightBandFree` 1) on the frame a change is FREED the carry is whole: the frame's twist of G about the framed line undone — the
  // picture keeps its roll across it (well defined at the vertical, where α is not); the rest then closes at `uprightMaxDegS`
  // ⭐⭐⭐ (fix round 1, F3 — measured: 3 – 5 one-frame flips left on his hand) and on a TIMED turn's first frame too (`fresh`): there the logic's view
  // jumps 33 – 54° across the band and its `Δα` (not a roll) was carried at `c` = 0.69 – 1 — 100 – 140° of the picture in one frame
  // ⭐ (fix round 2) F3 no longer behind `uprightBandFree` (it is not UD4b): a timed turn's first frame carried by the twist with the band's switch at 0 too
  // (`uprightMaxDegS` 0 — with `uprightBandFree` 0 the identity with e653099 — ignores the carry: the rest closes at once)
  const freedTwist = (fresh || (freed > 0 && st.cfg.uprightBandFree === 1)) && was !== null && was.upright !== undefined ? tw : null;
  const r = uprightStep(was?.upright?.state ?? UPRIGHT_REST, G, line, dtMs, knobs, scale, freedTwist);
  const P = poseRolled(G, line, r.phi);
  // ⭐⭐⭐ (2026-11-19, §8 UD11 — fix round 2) a hold belongs to a turn the player SEES: the hold this change set (`crossTurn` replaces any hold at the change)
  // dropped where the change is freed with the picture fully upright at both its ends and nothing left to close — the same push goes on, a come-back at once
  if (st.asmEdgeHold !== null && !uprightHoldKept(freed > 0, was?.upright?.w ?? 0, r.w, r.closed)) st.asmEdgeHold = null;
  const turnTw = fresh ? tw : (was?.turnTw ?? 0);
  const g = { gap: r.phi, speed: 0 };
  st.asmRollShadow = { ghost: G, dir: line.dir, piece, held: g, free: g, turn: zm, turnTw, stays: zm !== null, tw, gizmoFree, spit: spitZone(st) !== null, freshTurn: fresh, picture: P, a2: placeError(st, G, P, piece, line), drawn: true, freed, upright: { state: r.state, w: r.w, phi: r.phi } };
  return P;
}

/**
 * ⭐⭐⭐ (2026-11-18, `UPRIGHT_PICTURE.md` §2 step 4 — U3, UD2, UD4) UNDER LAW U, A CHANGE OF FRAME MADE FREE (no timed turn, the gizmo never held by it) only
 * where the picture is FULLY UPRIGHT at both its ends — `w` 1 on the pose before the change (last frame's) and on the ghost after it (this frame's, the
 * square camera's complement included): the glass does not turn there, a timed turn would only stall the gizmo. `uprightFreeTurns` 1: whatever its angle;
 * 0: under `freeTurnMaxDeg` as FO3 S1 (`turnIsFree`). `w` under 1 at either end: every change `1.0.147-`'s timed turn (UD4). The kinds that stay (the
 * square camera's, `byMm`, `out`, a tilt's) are refused before this is asked.
 */
function uprightFrees(st: SceneState, was: NonNullable<SceneState["asmRollShadow"]>, ghost: CamPose, whole: number, maxDeg: number): boolean {
  // ⭐⭐⭐ (2026-11-18, §6 UD4b — fix round 1, `uprightBandFree` 1) no stop under `freeTurnMaxDeg` near the vertical either: FO3's rule at ANY w (the
  // picture keeps its roll across the freed frame, the rest closes in time — `uprightPictureFrame`); 0: UD4 — in the band every change timed
  if (st.cfg.uprightBandFree === 1 && was.upright !== undefined && turnIsFree(whole, maxDeg)) return true;
  if (was.upright === undefined || !(was.upright.w >= 1)) return false;
  const sq = st.asmSquare;
  const share = sq.n === null || !(sq.q > 0) ? 0 : sq.q;
  const scale = st.cfg.uprightCloseIn === 1 ? 1 : 1 - share;
  if (!(uprightWeight(viewFromVertical(ghost), st.cfg.uprightFromDeg, st.cfg.uprightFullDeg) * scale >= 1)) return false;
  return st.cfg.uprightFreeTurns === 1 ? Number.isFinite(whole) : turnIsFree(whole, maxDeg);
}
