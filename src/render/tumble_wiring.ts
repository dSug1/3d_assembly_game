/**
 * ⭐⭐⭐ prototype — **THE YAW / PITCH GESTURE, WIRED** (`RESTING_FACE_ALIGNMENT.md` §18; the owner, 2026-10-10: *"build the yaw and pitch"*).
 * The decisions are `input/tumble_gesture.ts`'s (the axis, the steps, the swap, the reset) and `core/tumble.ts`'s (the axes, the next face,
 * the next edge direction); this holds the gesture in flight (`st.tumble`) and makes the steps (`tumbleRestingFace`, `rollRestingFace`).
 * ⛔ No rule here.
 * - **Touch** — begun when a second finger lands off any placed part while the orbit finger is down (`beginTouchTumble`): the ORBIT finger's
 *   travel yaws / pitches while the second finger is held STILL (`feedTouchTumble`); the second finger leaving its deadband hands both back
 *   (the pinch and the taps as before).
 * - **Mouse** — begun at a right press while the left button orbits (`beginMouseTumble`, asked by the mouse layer), fed the cursor's delta
 *   (`feedMouseTumble`).
 * Either ends at a release (`endTumble`). Outside the sphere, the piece aligned (`tumbleAvailable`).
 */
import { pxToMm } from "../core/units";
import { heldStill, startTrail, startTumble, stepTumble, trailAfter, trailBefore, trailTurn, tumbleTurnOf } from "../input/tumble_gesture";
import { otherTumbleAxis, restingFaceKey, restingFaceVertical, rollRestingFace, tumbleRestingFace } from "./green_box_wiring";
import type { SceneState } from "./scene_state";

/** ⭐ May a yaw / pitch start now — the orbited piece outside the sphere and aligned (it is from its spawn, §17). */
export function tumbleAvailable(st: SceneState): boolean {
  return st.greenBox !== null && st.pieceOutside === true && st.restAligned && st.restRoll !== null;
}

const posOf = (st: SceneState, id: number): readonly [number, number] | null => {
  const p = st.router.all().find((q) => q.id === id);
  return p === undefined ? null : [p.last.x, p.last.y];
};

/** ⭐ Touch: a second finger `b` landed OFF any placed part while the orbit finger `a` is down — the gesture is armed. */
export function beginTouchTumble(st: SceneState, a: number, b: number): void {
  const pa = posOf(st, a);
  const pb = posOf(st, b);
  if (pa === null || pb === null || !tumbleAvailable(st)) {
    st.tumble = null;
    return;
  }
  st.tumble = { a, b, aStart: pa, bStart: pb, mouseTravel: [0, 0], g: startTumble(performance.now()), turn: null, trail: null, axes: [] };
}

/**
 * ⭐ Touch: one of its fingers moved. `"OWNED"` — the move is the gesture's (nothing else runs: no orbit, no zoom); `"RELEASED"` — the second
 * finger left its deadband: the gesture is dropped, the caller goes on as before (a pinch, a tap that moved).
 */
export function feedTouchTumble(st: SceneState): "OWNED" | "RELEASED" {
  const t = st.tumble;
  if (t === null || t.a === null || t.b === null) return "RELEASED";
  const pa = posOf(st, t.a);
  const pb = posOf(st, t.b);
  if (pa === null || pb === null || !heldStill(pxToMm(pb[0] - t.bStart[0]), pxToMm(pb[1] - t.bStart[1]), st.cfg.motionDeadbandMm)) {
    st.tumble = null;
    st.lastVerdict = "orbit: the second touch moved — no yaw / pitch";
    st.hudDirty = true;
    return "RELEASED";
  }
  const r = stepTumble(
    t.g,
    [pxToMm(pa[0] - t.aStart[0]), -pxToMm(pa[1] - t.aStart[1])], // ⭐ y UP positive
    st.cfg.motionDeadbandMm,
    st.cfg.tumbleStepMm,
    performance.now(),
  );
  t.g = r.g;
  if (r.restarted) restartPath(st);
  makeSteps(st, r.steps);
  return "OWNED";
}

/** ⭐ Mouse: a right press while the left button orbits — does a two-button drag yaw / pitch now? It starts if so. */
export function beginMouseTumble(st: SceneState): boolean {
  const out = st.router.outside();
  const orbit = out.length === 1 && st.router.objects().length === 0 ? out[0]! : null;
  if (orbit === null || st.pointerTypeOf.get(orbit.id) !== "mouse" || !tumbleAvailable(st)) return false;
  st.tumble = { a: null, b: null, aStart: [0, 0], bStart: [0, 0], mouseTravel: [0, 0], g: startTumble(performance.now()), turn: null, trail: null, axes: [] };
  return true;
}

/** ⭐ Mouse: the two-button drag moved by `dx`, `dy` px (y down). */
export function feedMouseTumble(st: SceneState, dx: number, dy: number): void {
  const t = st.tumble;
  if (t === null || t.a !== null) return;
  t.mouseTravel = [t.mouseTravel[0] + dx, t.mouseTravel[1] + dy];
  const r = stepTumble(t.g, [pxToMm(t.mouseTravel[0]), -pxToMm(t.mouseTravel[1])], st.cfg.motionDeadbandMm, st.cfg.tumbleStepMm, performance.now());
  t.g = r.g;
  if (r.restarted) restartPath(st);
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

/** ⭐ The choice was undone (`stepTumble`'s `restarted` — the travel stopped, or came back within the deadband): turn and path start again. */
function restartPath(st: SceneState): void {
  const t = st.tumble;
  if (t === null) return;
  t.turn = null;
  t.trail = null;
  t.axes = [];
}

/**
 * ⭐ The whole steps of a latched axis. The turn decided once (x: yaw on a vertical face, else the roll; y: pitch); a yaw or a pitch walks
 * its PATH and, WHOLE (back on its face, or a full turn), moves on to the face's NEXT edge direction (`otherTumbleAxis`); the input reversed
 * walks the faces back, across the swaps too (the TRAIL, `trailBefore` / `trailAfter`).
 * ⛔⛔ THE CLAMP (2026-10-10, the owner: *"when the dx is too fast, the piece makes strange movements. consider clamping"*): ONE turn in flight
 * — a step only once the last one landed (`restAlign` null), and one at most; what a fast slide crosses meanwhile is dropped, never queued.
 * ⚠ Why: two steps queued are a turn past 180°, and the ease takes the SHORTEST way there — about another axis.
 */
function makeSteps(st: SceneState, steps: number): void {
  const t = st.tumble;
  if (t === null || t.g.axis === null) return;
  if (t.turn === null) t.turn = tumbleTurnOf(t.g.axis, restingFaceVertical(st));
  if (steps === 0 || st.restAlign !== null) return;
  const now = performance.now();
  const sense: 1 | -1 = steps > 0 ? 1 : -1;
  if (t.turn === "ROLL") {
    rollRestingFace(st, now, sense, true);
  } else {
    // ⭐⭐ the TRAIL: before the step, which path it walks — back along the previous one (the input reversed past a swap), on to the next
    // edge direction (a whole path, the input going on), or the one in flight (`trailBefore`); after it, the path counts the step
    const face = restingFaceKey(st);
    if (t.trail === null) {
      t.trail = startTrail(t.turn, face, sense);
      t.axes = [null];
    }
    const before = trailBefore(t.trail, face, sense);
    t.trail = before.trail;
    if (before.action === "BACK") t.axes = t.axes.slice(0, -1);
    if (before.action === "NEXT") {
      const prev = t.axes[t.axes.length - 1] ?? null;
      t.axes = [...t.axes, prev === null ? null : otherTumbleAxis(st, prev, sense)];
    }
    const r = tumbleRestingFace(st, now, trailTurn(t.trail), sense, t.axes[t.axes.length - 1] ?? null);
    if (r !== null) {
      t.axes[t.axes.length - 1] = r.axis;
      t.trail = trailAfter(t.trail, restingFaceKey(st), sense, r.angleRad);
      if (before.action === "NEXT") st.lastVerdict += " — the path was whole: on to the next edge direction";
      if (before.action === "BACK") st.lastVerdict += " — back along the previous path";
    }
  }
  st.hudDirty = true;
}
