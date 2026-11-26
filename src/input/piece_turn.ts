/**
 * ⭐⭐⭐ (2026-11-25, `IN14` — `Claude/10_INPUT_TOUCH/spec/PIECE_TURN.md`; the owner: *"a left click/press close to the piece … toggles the orbit of the
 * piece itself"* → the lead's proposal, his defaults and his four modifications → *"proceed as you recommended"*) **THE PIECE ZONE'S RULES** — engine-free:
 * - the ZONE on the glass (§4.1): the piece's bounding sphere on the glass plus a margin, floored at a finger's target, capped so there is room outside;
 * - the COMMIT (§4.2): past the tap slop, or past the deadband once the tap's time is over — before it nothing moves and a release is a tap;
 * - the TURN under the finger (§4.3): the virtual sphere's near point goes with the finger (Chen, Mountford & Sellen 1988), degrees per mm;
 * - the LIT QUAD (§4.3, D-P5): the direction the resting face is nearest to sitting on, with a hysteresis;
 * - the TWIST and the roll's nearest STOP (§4.4);
 * - the STEP BACK's two searches (§4.5): the first free place on a line by sphere tracing (Hart 1996), the way checked by conservative advancement
 *   (Mirtich 1996);
 * - the PIVOT about the piece's centre, and its bounding sphere;
 * - the UNDO's history (§4.7).
 * ⛔ No engine: points, angles, callbacks. The wiring is `render/piece_turn_wiring.ts`.
 */
import { cross, dot, length, normalize, qFromAxisAngle, qmul, qRotate, sub, type Quat, type Vec3 } from "../core/vec";
import { orbitDegPerMm } from "./follow_camera";
import type { GestureConfig } from "./gestureConfig";

// ─── the zone ─────────────────────────────────────────────────────────────────────────────────────────────────────

/** ⭐ The zone's radius on the glass (px): the sphere's plus the margin, at least `minPx`, at most `capPx` (a cap under the floor never shrinks it). */
export function zoneRadiusPx(spherePx: number, marginPx: number, minPx: number, capPx: number): number {
  return Math.max(minPx, Math.min(spherePx + marginPx, Math.max(minPx, capPx)));
}

/** ⭐ A press at (x, y) within the zone round (cx, cy) — its edge in. */
export function inZone(x: number, y: number, cx: number, cy: number, radiusPx: number): boolean {
  return Math.hypot(x - cx, y - cy) <= radiusPx;
}

/** ⭐ A sphere of radius `r` at `depth` in front of the eye, on the glass (px), the field of view VERTICAL (`fovRad`), the glass `heightPx` tall. */
export function sphereRadiusOnGlassPx(r: number, depth: number, fovRad: number, heightPx: number): number {
  if (!(depth > 1e-9)) return Infinity;
  return (r / (depth * Math.tan(fovRad / 2))) * (heightPx / 2);
}

// ─── the commit ───────────────────────────────────────────────────────────────────────────────────────────────────

/** ⭐ The press in the zone becomes a drag: past the tap slop, or past the deadband once the tap's time is over (all in px / ms). */
export function zoneCommitted(travelPx: number, elapsedMs: number, slopPx: number, deadbandPx: number, tapMs: number): boolean {
  return travelPx > slopPx || (elapsedMs > tapMs && travelPx > deadbandPx);
}

// ─── the turn ─────────────────────────────────────────────────────────────────────────────────────────────────────

/**
 * ⭐⭐⭐ (2026-11-26, §9 — his word: *"piece orbit speed = scene orbit gains (x, y) * piece orbit gains (x, y) * inputs (x,y)"*) THE SCENE ORBIT'S
 * DEGREES PER MM on the orbit around the assembly (the only place the zone runs): x the yaw's (`gainOrbitYaw` × `boxGainYaw`, `orbitDegPerMm`); y the
 * same — there a mm of dy turns as many degrees as a mm of dx (`pointer_wiring.ts`, `dvWant`; `gainOrbitElevation`, `boxGainPitch` do not act).
 * ⛔ The close-in gain not carried (D-P15).
 */
export function sceneOrbitDegPerMm(cfg: GestureConfig): { readonly x: number; readonly y: number } {
  const d = orbitDegPerMm(cfg, 0.5).yawDegPerMm;
  return { x: d, y: d };
}

/**
 * ⭐⭐⭐ (2026-11-26, §9.1 — his word: *"add a slider for piece roll gain"*) THE PIECE ROLL: the gain × the input's own angle (rad) — the twist's
 * (1:1 at gain 1) or A + dx's (mm × `pieceRollDegPerMm`). ⛔ The second finger's tap reads the fingers' twist, never this (D-P17).
 */
export function pieceRollAngle(inputRad: number, gain: number): number {
  return inputRad * gain;
}

/** ⭐⭐⭐ (§9) THE PIECE ORBIT'S TRAVEL, degrees per axis of the glass: the scene orbit's °/mm × the piece orbit's gain × the finger's mm. */
export function pieceTurnDegrees(
  dxMm: number,
  dyMm: number,
  scene: { readonly x: number; readonly y: number },
  gainX: number,
  gainY: number,
): { readonly dx: number; readonly dy: number } {
  return { dx: scene.x * gainX * dxMm, dy: scene.y * gainY * dyMm };
}

/**
 * ⭐⭐ The pose `q0` turned by the finger's travel since the press — `m` the travel as a WORLD vector in the glass's plane (mm: its right × dx, its up × −dy),
 * `f` the view (unit, eye to target): the piece's NEAR point goes with the finger, `degPerMm` of turn per mm, about the axis m × f.
 */
export function trackballTurn(q0: Quat, m: Vec3, f: Vec3, degPerMm: number): Quat {
  const mm = length(m);
  if (!(mm > 1e-12)) return q0;
  const axis = normalize(cross(m, f));
  if (axis === null) return q0;
  return qmul(qFromAxisAngle(axis, (mm * degPerMm * Math.PI) / 180), q0);
}

/**
 * ⭐⭐ THE LIT QUAD (D-P5): of the directions `dirs` (unit, world), the one the resting face's normal `n` is nearest to sitting on (anti-parallel — the
 * alignment's `−dir`); `current` kept until another is nearer by `hysteresisRad`. −1 with none.
 */
export function litDirection(n: Vec3, dirs: readonly Vec3[], current: number, hysteresisRad: number): number {
  if (dirs.length === 0) return -1;
  const angle = (d: Vec3): number => Math.acos(Math.max(-1, Math.min(1, -dot(n, d))));
  let best = 0;
  for (let i = 1; i < dirs.length; i++) if (angle(dirs[i]!) < angle(dirs[best]!)) best = i;
  if (current >= 0 && current < dirs.length && current !== best && angle(dirs[current]!) - angle(dirs[best]!) < hysteresisRad) return current;
  return best;
}

// ─── the roll ─────────────────────────────────────────────────────────────────────────────────────────────────────

const wrap = (a: number): number => {
  let x = a % (2 * Math.PI);
  if (x <= -Math.PI) x += 2 * Math.PI;
  if (x > Math.PI) x -= 2 * Math.PI;
  return x;
};

/** ⭐ The TWIST (rad) from the line a0 → b0 to the line a1 → b1 on the glass (y down): clockwise as seen positive, wrapped to (−π, π]. */
export function twistAngle(a0: readonly [number, number], b0: readonly [number, number], a1: readonly [number, number], b1: readonly [number, number]): number {
  return wrap(Math.atan2(b1[1] - a1[1], b1[0] - a1[0]) - Math.atan2(b0[1] - a0[1], b0[0] - a0[0]));
}

/** ⭐ A second finger's contact that rolls ONE stop: released as a tap, under `maxRad` (10°) of twist. */
export function twistIsTap(tapped: boolean, twistRad: number, maxRad = (10 * Math.PI) / 180): boolean {
  return tapped && Math.abs(twistRad) < maxRad;
}

/** ⭐ Of the candidate stops (signed angles), the nearest to `theta`; the first of a tie. */
export function nearestAngle(theta: number, stops: readonly number[]): number {
  let best = stops[0] ?? 0;
  for (const s of stops) if (Math.abs(s - theta) < Math.abs(best - theta) - 1e-12) best = s;
  return best;
}

// ─── the step back ────────────────────────────────────────────────────────────────────────────────────────────────

/**
 * ⭐⭐ ONE STEP OF SPHERE TRACING (Hart 1996) along a line — one query a frame: at `lift` the clearance `g` (a 1-Lipschitz distance) short of `need`, the
 * next lift is the clearance still missing further (at least `minStep`), which can never pass the first place it is reached; `null` — free here.
 */
export function traceStep(lift: number, g: number, need: number, minStep: number): number | null {
  if (g >= need - 1e-12) return null;
  return lift + Math.max(need - g, minStep);
}

/**
 * ⭐⭐ CONSERVATIVE ADVANCEMENT (Mirtich 1996) along a straight way from 0 to `to` (m): each step no longer than 0.9 × the gap beyond `keepM` (a straight
 * move that short reaches no part). `blocked`: a step under `minStepM` (a wall); out of `maxQueries`: stopped where it is, not blocked.
 */
export function advanceAlong(gapAt: (s: number) => number, to: number, keepM: number, maxQueries: number, minStepM: number): { readonly reached: number; readonly queries: number; readonly blocked: boolean } {
  let s = 0;
  let queries = 0;
  while (s < to && queries < maxQueries) {
    const g = gapAt(s);
    queries++;
    const step = Math.min(to - s, 0.9 * (g - keepM));
    if (!(step >= minStepM) && step < to - s) return { reached: s, queries, blocked: true };
    s += Math.max(0, step);
  }
  return { reached: Math.min(s, to), queries, blocked: false };
}

// ─── the pivot ────────────────────────────────────────────────────────────────────────────────────────────────────

/**
 * ⭐⭐ THE PIVOT ABOUT THE CENTRE: the world offset to add to the ring's anchor `ring` (where the resting face's centre goes) so the piece turned `q` keeps
 * its centre at `centre` — `c` its centre and `r` its resting face's centre in its own frame: centre − ring − q(c − r).
 */
export function pivotOffset(ring: Vec3, centre: Vec3, q: Quat, c: Vec3, r: Vec3): Vec3 {
  const w = qRotate(q, sub(c, r));
  return [centre[0] - ring[0] - w[0], centre[1] - ring[1] - w[1], centre[2] - ring[2] - w[2]];
}

/** ⭐ A shape's bounding sphere (its parts' points, its own frame): the box's centre, the farthest point's distance. */
export function boundingSphereOf(parts: readonly (readonly Vec3[])[]): { readonly centre: Vec3; readonly radius: number } {
  const lo = [Infinity, Infinity, Infinity];
  const hi = [-Infinity, -Infinity, -Infinity];
  for (const part of parts)
    for (const p of part)
      for (let k = 0; k < 3; k++) {
        lo[k] = Math.min(lo[k]!, p[k]!);
        hi[k] = Math.max(hi[k]!, p[k]!);
      }
  if (!Number.isFinite(lo[0]!)) return { centre: [0, 0, 0], radius: 0 };
  const centre: Vec3 = [(lo[0]! + hi[0]!) / 2, (lo[1]! + hi[1]!) / 2, (lo[2]! + hi[2]!) / 2];
  let radius = 0;
  for (const part of parts) for (const p of part) radius = Math.max(radius, length(sub(p, centre)));
  return { centre, radius };
}

// ─── the undo ─────────────────────────────────────────────────────────────────────────────────────────────────────

/** ⭐ The undo's history (§4.7): last in, first out, at most `max` (the oldest dropped). */
export class TurnHistory<T> {
  private readonly items: T[] = [];
  constructor(private readonly max = 32) {}
  get size(): number {
    return this.items.length;
  }
  push(x: T): void {
    this.items.push(x);
    while (this.items.length > this.max) this.items.shift();
  }
  pop(): T | null {
    return this.items.pop() ?? null;
  }
  peek(): T | null {
    return this.items[this.items.length - 1] ?? null;
  }
  clear(): void {
    this.items.length = 0;
  }
}
