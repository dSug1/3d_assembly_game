/**
 * ⭐⭐⭐ prototype — **THE YAW / PITCH GESTURE** (`RESTING_FACE_ALIGNMENT.md` §18; the owner, 2026-10-10: *"build the yaw and pitch"*).
 *
 * Outside the sphere, the orbited piece aligned:
 * - ⭐⭐ **Mobile** (2026-10-10, the owner: *"the input shall not be two-finger dx or two finger dy. It shall be: first touch delta position
 *   (dx or dy) while second touch is pressed outside a placed part and kept held and within delta positon deadbands"*) — the orbit finger's
 *   travel, while a second finger is down off any placed part and STILL (`heldStill`); the second finger leaving its deadband ends it.
 *   ⛔ The two-finger parallel slide, its spacing tolerance and its pair rule are deleted.
 * - **Desktop** — the right button pressed while the left one orbits, then a left drag (the right button is the held second touch).
 * - **The axis** — whichever of x and y FIRST passes the deadband owns it. ⭐ (2026-10-10, the owner: *"modify so that the selection is reset
 *   if the first delta selection comes back into its deadband"*) — back within the deadband along it, the choice is undone, and the next
 *   axis out of the deadband owns it.
 * - **The steps** — the travel along that axis (x right +, y UP +), whole steps of `stepMm` (`orbitRollSteps`: signed; back through zero
 *   before it steps the other way).
 * - **The turn** — x: YAW on a vertical resting face, the ROLL on a horizontal one (the owner: *"the two-finger dx should do the same as the
 *   roll"*); y: PITCH. Decided when the axis latches.
 * - ⭐⭐ **THE SWAP** (the owner: *"if the path brings the starting resting face back swap to the other movement (yaw or pitch) while the delta
 *   position continues and then reset when the delta position stops"* → *"make each swap move on to the next edge direction and generalize
 *   that in case of a more complex geometry (for example multifaceted sphere)"*): a path is WHOLE when it is back on the face it started
 *   from with a net count, or has turned a FULL TURN (a faceted sphere's loop need not come back to its face) — `trailAfter`; the same
 *   travel then goes on about the face's NEXT edge direction (`nextEdgeAxis`), yaw and pitch alternating as names. ⭐ The input REVERSED
 *   walks the faces back, across the swaps too (`trailBefore`'s BACK — *"make sure the faces paths are reversed if the input goes in the
 *   other direction"*). ⛔ The roll never swaps.
 * - ⭐ **THE RESET** — the travel STOPS (none, in any direction, for `TUMBLE_REST_MS`): the axis, the turn and the path start again.
 * ⛔ No engine, no scene: positions in millimetres, times in ms.
 */
import { orbitRollSteps } from "./piece_orbit";

export type TumbleTurn = "YAW" | "PITCH" | "ROLL";

/**
 * ⭐ How long the travel may stand still before it counts as STOPPED (the owner's *"reset when the delta position stops"*). ⚠ A claim about a
 * hand, not the hardware: well above a frame's dispatch gap on the tablet (47–87 ms, `D86`), well below a deliberate pause.
 */
export const TUMBLE_REST_MS = 250;
/** ⭐ Travel smaller than this (mm) is not movement — the measured pointer noise, rounded up (`pointerNoiseMm` 0.761). */
export const TUMBLE_MOVE_MM = 1;

export interface TumbleGesture {
  readonly axis: "X" | "Y" | null;
  /** The travel at the last (re)start — the axis latches on the travel since it (mm). */
  readonly origin: readonly [number, number];
  /** The travel along the latched axis already counted (mm, since `origin`). */
  readonly countedMm: number;
  /** The travel not yet a whole step (mm, signed). */
  readonly acc: number;
  /** The travel (x, y) when it last MOVED — in any direction — and when (ms): what tells a stop. */
  readonly movedAt2: readonly [number, number];
  readonly movedAt: number;
}

/** ⭐ A gesture starting. */
export function startTumble(now = 0): TumbleGesture {
  return { axis: null, origin: [0, 0], countedMm: 0, acc: 0, movedAt2: [0, 0], movedAt: now };
}

/**
 * ⭐ One step of the gesture: `travelMm` the first touch's (or the cursor's) travel SINCE THE START (x right, y up), `now` in ms. The new
 * state, the whole steps to make now (signed, along the latched axis), and `restarted` — the choice was undone (the travel stopped and moves
 * again, or came back within the deadband): the caller starts its turn and path again.
 */
export function stepTumble(
  g: TumbleGesture,
  travelMm: readonly [number, number],
  deadbandMm: number,
  stepMm: number,
  now = 0,
): { readonly g: TumbleGesture; readonly steps: number; readonly restarted: boolean } {
  let s: TumbleGesture = g;
  let restarted = false;
  // ⭐ the RESET: latched, still for TUMBLE_REST_MS, and moving again (in any direction) — a new start from where it stood
  if (Math.hypot(travelMm[0] - s.movedAt2[0], travelMm[1] - s.movedAt2[1]) >= TUMBLE_MOVE_MM) {
    if (s.axis !== null && now - s.movedAt > TUMBLE_REST_MS) {
      s = { ...s, axis: null, origin: [s.movedAt2[0], s.movedAt2[1]], countedMm: 0, acc: 0 };
      restarted = true;
    }
    s = { ...s, movedAt2: [travelMm[0], travelMm[1]], movedAt: now };
  }
  const rel: readonly [number, number] = [travelMm[0] - s.origin[0], travelMm[1] - s.origin[1]];
  // ⭐ the choice UNDONE: back within the deadband along the latched axis
  if (s.axis !== null && Math.abs(s.axis === "X" ? rel[0] : rel[1]) <= deadbandMm) {
    s = { ...s, axis: null, countedMm: 0, acc: 0 };
    restarted = true;
  }
  if (s.axis === null) {
    const ax = Math.abs(rel[0]);
    const ay = Math.abs(rel[1]);
    if (ax > deadbandMm || ay > deadbandMm) s = { ...s, axis: ax >= ay ? "X" : "Y" };
  }
  if (s.axis === null) return { g: s, steps: 0, restarted };
  const along = s.axis === "X" ? rel[0] : rel[1];
  const r = orbitRollSteps(s.acc, along - s.countedMm, stepMm);
  return { g: { ...s, countedMm: along, acc: r.acc }, steps: r.steps, restarted };
}

/** ⭐ Is the second touch still HELD STILL — its travel since its press within the deadband, along x and y (mm)? */
export function heldStill(dxMm: number, dyMm: number, deadbandMm: number): boolean {
  return Math.abs(dxMm) <= deadbandMm && Math.abs(dyMm) <= deadbandMm;
}

/** ⭐ What a latched axis turns first: x — the YAW on a vertical resting face, else the ROLL; y — the PITCH. */
export function tumbleTurnOf(axis: "X" | "Y", verticalFace: boolean): TumbleTurn {
  return axis === "Y" ? "PITCH" : verticalFace ? "YAW" : "ROLL";
}

/**
 * ⭐ One path of a trail: the face it started from, its net steps and turn (rad), the sense it runs (the sense that made it whole, or that
 * pushed it), and whether it is WHOLE — back on its face with a net count, or a full turn turned.
 */
export interface TumblePath {
  readonly startFace: string;
  readonly net: number;
  readonly turned: number;
  readonly dir: 1 | -1;
  readonly whole: boolean;
}

/** ⭐ The paths walked in one gesture, the last the one in flight. Yaw and pitch alternate as names (the first named by the latched axis). */
export interface TumbleTrail {
  readonly first: "YAW" | "PITCH";
  readonly paths: readonly TumblePath[];
}

/** ⭐ A full turn, less a hair: what a path has to have turned to be whole without its face coming back. */
const FULL_TURN = 2 * Math.PI - 1e-3;

/** ⭐ A trail starting on `face`, its first movement `first`, its first step `sense`. */
export function startTrail(first: "YAW" | "PITCH", face: string, sense: 1 | -1): TumbleTrail {
  return { first, paths: [{ startFace: face, net: 0, turned: 0, dir: sense, whole: false }] };
}

/** ⭐ The movement name of the path in flight — yaw and pitch alternate along the trail. */
export function trailTurn(t: TumbleTrail): "YAW" | "PITCH" {
  if ((t.paths.length - 1) % 2 === 0) return t.first;
  return t.first === "YAW" ? "PITCH" : "YAW";
}

/**
 * ⭐⭐ BEFORE a step of `sense` from `face` — which path it walks (2026-10-10, the owner: *"make sure the faces paths are reversed if the input
 * goes in the other direction"*):
 * - `"BACK"` — the path in flight is still at its start (net 0) and the step goes AGAINST the sense that brought the trail into it: it is
 *   dropped, and the step walks the PREVIOUS path backwards (the faces come back in reverse, across the swap);
 * - `"NEXT"` — the path in flight is WHOLE and the step goes ON in the sense that made it whole: a new path from here, about the next edge
 *   direction (`nextEdgeAxis`, in that sense);
 * - `"STAY"` — the path in flight.
 */
export function trailBefore(t: TumbleTrail, face: string, sense: 1 | -1): { readonly trail: TumbleTrail; readonly action: "BACK" | "NEXT" | "STAY" } {
  const top = t.paths[t.paths.length - 1]!;
  if (top.net === 0 && t.paths.length > 1 && sense !== top.dir) return { trail: { ...t, paths: t.paths.slice(0, -1) }, action: "BACK" };
  if (top.whole && sense === top.dir)
    return { trail: { ...t, paths: [...t.paths, { startFace: face, net: 0, turned: 0, dir: sense, whole: false }] }, action: "NEXT" };
  return { trail: t, action: "STAY" };
}

/**
 * ⭐⭐ AFTER a step of `sense` (and `angleRad`) that landed on `face`: the path in flight counts it, and is WHOLE when back on its face with a
 * net count, or a full turn turned (a faceted sphere's loop need not come back to its face) — its sense then the one that made it so.
 */
export function trailAfter(t: TumbleTrail, face: string, sense: 1 | -1, angleRad: number): TumbleTrail {
  const top = t.paths[t.paths.length - 1]!;
  const net = top.net + sense;
  const turned = top.turned + sense * angleRad;
  const whole = (face === top.startFace && net !== 0) || Math.abs(turned) >= FULL_TURN;
  return { ...t, paths: [...t.paths.slice(0, -1), { ...top, net, turned, whole, dir: whole ? sense : top.dir }] };
}
