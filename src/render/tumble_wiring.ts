/**
 * ⭐⭐⭐ prototype — **THE YAW / PITCH GESTURE, WIRED** (`RESTING_FACE_ALIGNMENT.md` §18; the owner, 2026-10-10: *"build the yaw and pitch"*).
 * The decisions are `input/tumble_gesture.ts`'s (slide or pinch, the axis, the steps) and `core/tumble.ts`'s (the axes, the next face);
 * this holds the gesture in flight (`st.tumble`) and makes the steps (`tumbleRestingFace`, `rollRestingFace`). ⛔ No rule here.
 * - **Touch** — begun when a second finger lands while the orbit finger is down (`beginTouchTumble`), fed by either finger's moves
 *   (`feedTouchTumble`): UNDECIDED and SLIDE own the moves (no orbit, no zoom); a PINCH hands them back, the pinch re-based so the zoom does
 *   not jump.
 * - **Mouse** — begun at a right press while the left button orbits (`beginMouseTumble`, asked by the mouse layer), fed the cursor's delta
 *   (`feedMouseTumble`).
 * Either ends at a release (`endTumble`). Outside the sphere, the piece aligned (`tumbleAvailable`).
 */
import { pxToMm } from "../core/units";
import { startTumble, stepTumble, tumbleTurnOf } from "../input/tumble_gesture";
import { restingFaceVertical, rollRestingFace, tumbleRestingFace } from "./green_box_wiring";
import { pinchPair } from "./camera_rig";
import type { SceneState } from "./scene_state";

/** ⭐ May a yaw / pitch start now — the orbited piece outside the sphere and aligned (it is from its spawn, §17). */
export function tumbleAvailable(st: SceneState): boolean {
  return st.greenBox !== null && st.pieceOutside === true && st.restAligned && st.restRoll !== null;
}

const posOf = (st: SceneState, id: number): readonly [number, number] | null => {
  const p = st.router.all().find((q) => q.id === id);
  return p === undefined ? null : [p.last.x, p.last.y];
};

/** ⭐ Touch: the second finger `b` landed while the orbit finger `a` is down — the gesture starts UNDECIDED. */
export function beginTouchTumble(st: SceneState, a: number, b: number): void {
  const pa = posOf(st, a);
  const pb = posOf(st, b);
  if (pa === null || pb === null || !tumbleAvailable(st)) {
    st.tumble = null;
    return;
  }
  st.tumble = {
    a,
    b,
    startMid: [(pa[0] + pb[0]) / 2, (pa[1] + pb[1]) / 2],
    mouseTravel: [0, 0],
    g: startTumble(pxToMm(Math.hypot(pa[0] - pb[0], pa[1] - pb[1]))),
    turn: null,
  };
}

/**
 * ⭐ Touch: one of its fingers moved. `"OWNED"` — the move is the gesture's (undecided, or a slide: nothing else runs); `"PINCH"` — it
 * turned out a pinch, the gesture is dropped and the pinch re-based from here, the caller goes on as before.
 */
export function feedTouchTumble(st: SceneState): "OWNED" | "PINCH" {
  const t = st.tumble;
  if (t === null || t.a === null || t.b === null) return "PINCH";
  const pa = posOf(st, t.a);
  const pb = posOf(st, t.b);
  if (pa === null || pb === null) {
    st.tumble = null;
    return "PINCH";
  }
  const mid = [(pa[0] + pb[0]) / 2, (pa[1] + pb[1]) / 2] as const;
  const wasSlide = t.g.kind === "SLIDE";
  const r = stepTumble(
    t.g,
    [pxToMm(mid[0] - t.startMid[0]), -pxToMm(mid[1] - t.startMid[1])], // ⭐ y UP positive
    pxToMm(Math.hypot(pa[0] - pb[0], pa[1] - pb[1])),
    st.cfg.tumbleSpacingTolMm,
    st.cfg.motionDeadbandMm,
    st.cfg.tumbleStepMm,
  );
  if (r.g.kind === "PINCH") {
    st.tumble = null;
    // ⭐ the zoom starts from here, not from the fingers' press — what the spacing changed while undecided is not a jump
    const p = pinchPair(st);
    if (p) {
      st.pinch.begin(p[0], p[1]);
      st.zoomAtPinchStart = st.zoom;
    }
    st.lastVerdict = "orbit: two fingers — a pinch";
    return "PINCH";
  }
  t.g = r.g;
  if (r.g.kind === "SLIDE" && !wasSlide) {
    // ⭐ a slide is no tap: neither the second touch on the piece nor the pink-face tap
    if (st.orbitTap !== null) st.orbitTap.second = null;
    st.pinkTap = null;
  }
  makeSteps(st, r.steps);
  return "OWNED";
}

/** ⭐ Mouse: a right press while the left button orbits — does a two-button drag yaw / pitch now? It starts if so. */
export function beginMouseTumble(st: SceneState): boolean {
  const out = st.router.outside();
  const orbit = out.length === 1 && st.router.objects().length === 0 ? out[0]! : null;
  if (orbit === null || st.pointerTypeOf.get(orbit.id) !== "mouse" || !tumbleAvailable(st)) return false;
  st.tumble = { a: null, b: null, startMid: [0, 0], mouseTravel: [0, 0], g: startTumble(null), turn: null };
  return true;
}

/** ⭐ Mouse: the two-button drag moved by `dx`, `dy` px (y down). */
export function feedMouseTumble(st: SceneState, dx: number, dy: number): void {
  const t = st.tumble;
  if (t === null || t.a !== null) return;
  t.mouseTravel = [t.mouseTravel[0] + dx, t.mouseTravel[1] + dy];
  const r = stepTumble(
    t.g,
    [pxToMm(t.mouseTravel[0]), -pxToMm(t.mouseTravel[1])],
    null,
    st.cfg.tumbleSpacingTolMm,
    st.cfg.motionDeadbandMm,
    st.cfg.tumbleStepMm,
  );
  t.g = r.g;
  makeSteps(st, r.steps);
}

/** ⭐ The gesture ends — a finger lifted (`pointerId`, one of its two), or the mouse's drag ended (none). */
export function endTumble(st: SceneState, pointerId?: number): void {
  const t = st.tumble;
  if (t === null) return;
  if (pointerId !== undefined && pointerId !== t.a && pointerId !== t.b) return;
  st.tumble = null;
  st.hudDirty = true;
}

/** ⭐ The whole steps of a latched slide: the turn decided once (x: yaw on a vertical face, else the roll; y: pitch), then made. */
function makeSteps(st: SceneState, steps: number): void {
  const t = st.tumble;
  if (t === null || t.g.axis === null) return;
  if (t.turn === null) t.turn = tumbleTurnOf(t.g.axis, restingFaceVertical(st));
  const now = performance.now();
  for (let i = 0; i < Math.abs(steps); i++) {
    const sense: 1 | -1 = steps > 0 ? 1 : -1;
    const ok = t.turn === "ROLL" ? rollRestingFace(st, now, sense, true) : tumbleRestingFace(st, now, t.turn, sense);
    if (!ok) break;
  }
  st.hudDirty = true;
}
