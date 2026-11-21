/**
 * ⭐⭐⭐ (2026-11-21, `Claude/40_RENDER_SCENE/spec/PICTURE_REBUILD.md` §4.1 – §4.4 — packet R3a, `pictureOne` 1 with `cameraFollower` 1) THE ONE PICTURE AT THE
 * CAMERA'S STAGE: the state and the one call in place of `followFrame ?? rollPictureFrame`. The rules are pure (`input/picture.ts`, `pictureStep`).
 *
 * * FAR (the follower draws — `followActive`, as today): `followFrame` with the picture's hook: the follower's own step and pose (`followTopStep` /
 *   `followStep`, `followPose`, their turns — unchanged), then `pictureStep` — outside the band, no up held and outside the turntable's cone it returns the
 *   follower's pose objects themselves and the world's up, so the drawn eye / look / up / piece are the follower's bit for bit (the same functions, in the
 *   same order, nothing else run). In the band the drawn moves to the logic's pose by place.
 * * CLOSE (elsewhere): the close drawer as today (`rollPictureFrame`: close in's turns, square camera, carried up, J) is G; `pictureStep` draws G latched
 *   with the up's hand-over (none left: G itself, its own frame published as drawn), and unlatched (the way out) by the band toward the follower. The follower is
 *   PARKED meanwhile at rest on its own far target — the heading carried from the drawn up (O-3: never the view's residue), the facet and the orbit at
 *   their place — so it goes on from there, never restarted.
 * * ⭐⭐⭐ (2026-11-21 night, §4.3a — R3-FIX) amended: NOT LATCHED THE FOLLOWER DRAWS, whatever logic turn runs (the close drawer then runs for the logic only,
 *   not drawn); its heading the one owner, the band its elevation only; CLOSE is the latched frame (and the rare frame with no direction asked or a placed
 *   piece). The latch and the unlatch hold the pose drawn and hand it over by his finger (`pictureStep`'s hand-over).
 */
import type { Vec3 } from "../core/vec";
import { followStart, followTopTarget, headingOf } from "../input/camera_follow";
import { upSquareToView } from "../input/camera_frame";
import { blendShare, holdAtCrossing, squareTurning, tiltDir, type CamFrame, type CamPose } from "../input/orbit_tilt";
import { orbitDir } from "../input/assembly_orbit";
import { poseTurnAngle } from "../input/roll_follow";
import { changeSeen, holdSeen, uprightWeight, viewFromVertical } from "../input/upright";
import { PICTURE_CONE_DEG, PICTURE_REST, pictureStep, type PictureIn, type PicturePose } from "../input/picture";
import { followActive, followFrame, type FollowPicture } from "./camera_follow_wiring";
import { CHANGE_NONE, rollPictureFrame, type ChangeLeft } from "./roll_shadow";
import { approachBand, changeApply, dirFrame, gizmoFacetW, pictureEventsRead } from "./assembly_wiring";
import type { SceneState } from "./scene_state";

/**
 * ⭐⭐⭐ (2026-11-21, `PICTURE_REBUILD.md` §4.4 — R3b, RB1's one place) THE ONE RESOLVER of the change of frame the logic asks (`asmChange`), before any drawer:
 * where the follower draws, AT ONCE with the dy hold of the logic's crossing (OP8; under the top's rule none — D-H8, D-F4); elsewhere close in's rule
 * (`changeSeen`: a timed turn, or at once with the carried up's hold to come — C6; law U's own under `uprightCarried` 0) — each moved here AS WRITTEN from
 * `followFrame`, `carriedFrame`, `uprightPictureFrame`, at the same moment of the frame (nothing between reads what they change).
 */
function changeResolve(st: SceneState, eye: Vec3, look: Vec3, up: Vec3): ChangeLeft {
  const ask = st.asmChange;
  if (ask === null) return CHANGE_NONE;
  if (followActive(st) && !st.orbitPiecePlaced) {
    const top = st.cfg.followTop === 1;
    changeApply(st, ask, false, top ? undefined : ask.hold !== undefined ? holdAtCrossing(ask.hold) : undefined);
    return CHANGE_NONE;
  }
  if (!(st.cfg.freeTurnMaxDeg > 0) || st.cfg.uprightPicture !== 1) return CHANGE_NONE;
  const view: Vec3 = [look[0] - eye[0], look[1] - eye[1], look[2] - eye[2]];
  const ghost: CamPose = { eye, look, up: upSquareToView(up, view) };
  const was = st.asmRollShadow;
  const sq = st.asmSquare;
  const sqTurning = squareTurning(sq.n, sq.target, sq.q);
  const tl = st.asmTilt;
  const tiltHold = tl !== null && (tl.exit || tl.off);
  const share = sq.n === null || !(sq.q > 0) ? 0 : sq.q;
  if (st.cfg.uprightCarried === 1) {
    // the carried up's rule (packet E, `carriedFrame` as at `620f227`)
    const kappa = st.cfg.uprightCloseIn === 1 ? 1 : 1 - share;
    const drawn = was !== null && was.drawn && was.one !== undefined;
    const turnRad = drawn ? poseTurnAngle(was.ghost, ghost) : Number.NaN;
    const stays = !drawn || was.turn !== null || ask.paced || ask.byMm || ask.tilt || sqTurning || tiltHold;
    const seen = changeSeen({ stays, wBefore: drawn ? was.one!.kappa : 0, wAfter: kappa, turnRad, freeMaxDeg: st.cfg.freeTurnMaxDeg });
    changeApply(st, ask, seen.timed, seen.timed && ask.hold !== undefined ? holdSeen(seen, ask.hold, null, null) : undefined);
    if (seen.timed) return CHANGE_NONE;
    return { change: true, ...(ask.hold !== undefined ? { crossed: ask.hold } : {}), freed: turnRad > 0 ? turnRad : Number.MIN_VALUE };
  }
  // law U's rule (`uprightPictureFrame` as at `620f227`, §12 RB1 – RB2)
  const scale = st.cfg.uprightCloseIn === 1 ? 1 : 1 - share;
  const drawn = was !== null && was.drawn && was.upright !== undefined;
  const turnRad = drawn ? poseTurnAngle(was.ghost, ghost) : Number.NaN;
  const stays = !drawn || was.turn !== null || ask.paced || ask.byMm || ask.tilt || sqTurning || tiltHold;
  const wAfter = uprightWeight(viewFromVertical(ghost), st.cfg.uprightFromDeg, st.cfg.uprightFullDeg) * scale;
  const seen = changeSeen({ stays, wBefore: drawn ? was.upright!.w : 0, wAfter, turnRad, freeMaxDeg: st.cfg.freeTurnMaxDeg });
  const hold = ask.hold === undefined ? undefined : holdSeen(seen, ask.hold, drawn ? was.picture : null, drawn ? was.ghost : null);
  changeApply(st, ask, seen.timed, hold);
  return seen.timed ? CHANGE_NONE : { change: false, freed: turnRad > 0 ? turnRad : Number.MIN_VALUE };
}

/** ⭐⭐⭐ (R3b, D-P6) THE FRAME DRAWN, published here only (`asmCamDrawn`): the drawer's own, else the logic's (exactly what `asmCamLast` held after the stage). */
function publishDrawn(st: SceneState, cam: CamFrame | null): void {
  st.asmCamDrawn = cam ?? st.asmCamLogic;
}

/** ⭐ The one picture draws here: the switch on and the follower's switch on (the band is the follower's); else today's line exactly. */
export function pictureOn(st: SceneState): boolean {
  return st.cfg.pictureOne === 1 && st.cfg.cameraFollower === 1;
}

/** ⭐ (R3b) TODAY'S LINE, exactly (`pictureOne` 0, or the follower off): the follower, else the close drawer — the change resolved once before, the facts read after. */
function pictureLegacy(st: SceneState, pp: Vec3, foot: Vec3, eye: Vec3, look: Vec3, up: Vec3, gapM: number, off: { readonly yawRad: number; readonly pitchRad: number }, dtMs: number): CamPose {
  const left = changeResolve(st, eye, look, up);
  const zp = followFrame(st, pp, foot, eye, look, up, gapM, off, dtMs) ?? rollPictureFrame(st, pp, eye, look, up, dtMs, left);
  pictureEventsRead(st, zp.ev);
  publishDrawn(st, zp.cam);
  return zp;
}

/**
 * ⭐⭐⭐ ONE FRAME OF THE PICTURE: the pose drawn (`eye`, `look`, `up`) — the camera's stage squares the up. `eye`, `look`, `up`: the logic's pose (the
 * ghost); `pp` its piece; `foot` the gizmo's foot (the orbit's centre); `dvPerMm` the approach coordinate a mm of his finger (`orbitDvPerMm`).
 */
export function pictureFrame(
  st: SceneState,
  pp: Vec3,
  foot: Vec3,
  eye: Vec3,
  look: Vec3,
  up: Vec3,
  gapM: number,
  off: { readonly yawRad: number; readonly pitchRad: number },
  dtMs: number,
  dvPerMm: number,
): CamPose {
  if (!pictureOn(st)) return pictureLegacy(st, pp, foot, eye, look, up, gapM, off, dtMs);
  const left = changeResolve(st, eye, look, up);
  const was = st.asmPicture;
  const s0 = was?.s ?? PICTURE_REST;
  const w = approachBand(st);
  // his finger's mm this frame: the orbit's (deadbanded, `asmFrameMm`) and the approach's outward (the way out's own count, C3)
  const da = was === null ? 0 : st.approach - was.aWas;
  const mm = Math.max(0, st.asmFrameMm) + (da > 0 && dvPerMm > 0 ? da / dvPerMm : 0);
  const hang = Math.hypot(pp[0] - foot[0], pp[1] - foot[1], pp[2] - foot[2]);
  const us: Vec3 = hang > 1e-9 ? [(pp[0] - foot[0]) / hang, (pp[1] - foot[1]) / hang, (pp[2] - foot[2]) / hang] : (st.asmAsk ?? [0, 0, 1]);
  const base = { us, look, foot, hang, gapM, offYawRad: off.yawRad, offPitchRad: off.pitchRad, mm, spanMm: st.cfg.pictureBandMm, coneDeg: PICTURE_CONE_DEG };
  let s1 = s0;
  // ⭐⭐⭐ (2026-11-21 night, `PICTURE_REBUILD.md` §4.3a rule 4 — R3-FIX, the lead's amendment) NOT LATCHED THE FOLLOWER DRAWS — far, the band, between it and
  // the latch, through EVERY logic turn (`asmZoneMix`, the way out's included), the square camera's share, a tilt turning off: `followActive` is no reason to
  // leave the far path. ⛔ R3: each logic turn sent the frame to the close branch — the follower parked (`followStart(T)` every frame, T from a reading that
  // flips) blended with the logic's turning G by w: jitter at every turn (his third video, `Scene_0bis`, the camera 2.4 m from its centre)
  const farPath = !st.asmTiltAuto && st.asmAsk !== null && !st.orbitPiecePlaced;
  if (farPath) {
    // the close drawer runs for the LOGIC where the follower would not have drawn (a turn's angle — `zoneMixPose` —, its clocks, the carried up's state, the
    // record its rules read) — NOT drawn; its facts read as before (the resolver above unchanged: the gizmo's waits and the holds stay the logic's)
    const Gl = followActive(st) ? null : rollPictureFrame(st, pp, eye, look, up, dtMs, left);
    if (Gl !== null) pictureEventsRead(st, Gl.ev);
    // the hand-over left from the latch closed by the way out's OWN share (C3: his out mm) while its turn lives; else by his mm (`pictureStep`)
    const zmO = st.asmZoneMix;
    const share = zmO !== null && zmO.out !== undefined ? zmO.k : null;
    const hook: FollowPicture = (P, dFar, hangF, usF) => {
      const inp: PictureIn = { ...base, hang: hangF, us: usF, w, dFar, F: P, G: { eye, look, up, piece: pp }, latched: false, share };
      const r = pictureStep(s0, inp);
      s1 = r.state;
      return r.pose;
    };
    const fp = followFrame(st, pp, foot, eye, look, up, gapM, off, dtMs, hook, Gl !== null);
    if (fp !== null) {
      pictureEventsRead(st, fp.ev);
      publishDrawn(st, fp.cam);
      // the heading the follower carries — where it is parked if close in begins without a latch
      const fs = st.asmFollow;
      const psiPark = fs?.top?.psiT ?? (fs?.state ? headingOf(fs.state.d) : null) ?? was?.psiPark ?? null;
      st.asmPicture = { s: s1, aWas: st.approach, w, far: true, psiPark };
      return fp;
    }
  }
  // CLOSE (latched; or no direction asked, or a placed piece): G drawn by the close drawer, as today; the hand-over by his finger
  const G = rollPictureFrame(st, pp, eye, look, up, dtMs, left);
  pictureEventsRead(st, G.ev);
  const latched = st.asmTiltAuto;
  const zm = st.asmZoneMix;
  const share = latched ? (st.asmTiltPending ? 0 : st.asmBlend !== null ? blendShare(st.asmBlend.mm, st.cfg.tiltBlendMm) : 1) : zm !== null && zm.out !== undefined ? zm.k : null;
  const Gp: PicturePose = { eye: G.eye, look: G.look, up: G.up, piece: pp };
  // the follower parked at rest on its own target (the heading carried) — through the way out the band draws toward it by place
  // ⭐ its heading: latched the turntable's, set from the drawn up (last frame); unlatched (the way out) HELD from there — ⛔ re-read from the view drawn
  // in the band, the heading fed back on itself frame by frame (a drift by time)
  const psiPark = latched ? (s0.tt?.psi ?? was?.psiPark ?? null) : (was?.psiPark ?? s0.tt?.psi ?? null);
  const dFar = followPark(st, psiPark) ?? us;
  const r = pictureStep(s0, { ...base, w, dFar, F: null, G: Gp, latched, share });
  let cam = G.cam;
  if (r.pose.up !== G.up || r.pose.eye !== G.eye) {
    const d: Vec3 = [r.pose.eye[0] - r.pose.look[0], r.pose.eye[1] - r.pose.look[1], r.pose.eye[2] - r.pose.look[2]];
    const l = Math.hypot(d[0], d[1], d[2]);
    if (l > 1e-12) cam = { dir: [d[0] / l, d[1] / l, d[2] / l], up: r.state.up ?? r.pose.up };
  }
  publishDrawn(st, cam);
  if (r.pose.piece !== pp) {
    // the band moves the drawn piece onto the follower's line (as the follower draws it): the logic's piece is kept
    const a = st.pieceAnchor;
    st.pieceFrameStepM = a === null ? 0 : Math.hypot(r.pose.piece[0] - a[0], r.pose.piece[1] - a[1], r.pose.piece[2] - a[2]);
    st.pieceAnchor = r.pose.piece;
    st.asmPieceDrawn = [r.pose.piece[0], r.pose.piece[1], r.pose.piece[2]];
  }
  st.asmPicture = { s: r.state, aWas: st.approach, w, far: false, psiPark: latched ? (r.state.tt?.psi ?? psiPark) : psiPark };
  return { eye: r.pose.eye, look: r.pose.look, up: r.pose.up };
}

/**
 * ⭐⭐⭐ (O-3, D-P5) THE FOLLOWER PARKED while G draws: at rest ON its own far target — the top's rule: the levelled reading, else the heading carried `psi`
 * (the turntable's, set from the drawn up), the asked height capped; the detour's: the direction asked — its top state at the gizmo's facet and the orbit's
 * place now. So when far begins again it goes on from where its target is: no restart on the drawn direction, no drift by time, no spin.
 */
function followPark(st: SceneState, psi: number | null): Vec3 | null {
  const ask = st.asmAsk;
  if (ask === null) return null;
  const was = st.asmFollow;
  const rec = { on: 0, pic: 1 };
  if (st.cfg.followTop !== 1) {
    st.asmFollow = { state: followStart(ask), piece: null, rec };
    return ask;
  }
  const L = st.asmAskLevel ?? psi ?? headingOf(ask) ?? was?.top?.psiT ?? 0;
  const T = followTopTarget(L, ask, st.cfg.followPoleDeg);
  const orbitW = tiltDir(dirFrame(st), orbitDir(st.orbit.yaw, st.orbit.elevation));
  st.asmFollow = { state: followStart(T), piece: null, rec, top: { psiT: L, nW: gizmoFacetW(st), turn: null, step: 0, orbitWas: orbitW, pace: 0 } };
  return T;
}
