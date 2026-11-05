/**
 * ⭐⭐⭐ (2026-11-05, `TILTED_ORBIT_REBUILD_SCOPE.md` §21.4 R1 / R4) **THE FINGER READ ON THE SCREEN**: the orbit's two axes (0: the yaw, 1: the pitch, in the
 * orbit's frame) each move the gizmo along one of the two sections; on the screen each step goes some way (`screen`: its direction, right / up). The axis
 * whose screen direction is the more HORIZONTAL is dx's (the green), the other dy's (the red) — so a line may change colour after a roll — each taken in
 * the sense that moves the gizmo the FINGER's way (I5: dx right → the gizmo right, dy up → up). R4: an axis whose screen direction lies too far off its
 * finger axis (beyond `ROLE_MIN_COS`) passes nothing.
 * ⭐⭐⭐ (§21.5 F4) the roles are a FACE's — read once, at the crossing onto it, from its own square view (never the rolling camera's: §21.5 cause 5);
 * ⭐⭐⭐ (§21.5 F1, the owner: *"if the delta position would drive the gizmo in an opposite direction, hold the input … this overrules anything else"*)
 * R4's HOLD (`holdByMotion`, `throughHold`): at a change of the finger's motion, a finger component that would now send the gizmo the OPPOSITE way in the
 * WORLD (the new face unfolded onto the old — §21.6) is HELD: it passes nothing until it reverses (or the drag ends); the other component goes on.
 * ⛔ ENGINE-FREE.
 */
import { dot, qRotate, shortestArc, type Vec3 } from "../core/vec";

/** ⭐ The least |cos| between an axis's screen direction and its finger axis for the axis to move (≈ 70°). */
export const ROLE_MIN_COS = 0.35;

/** ⭐ Which orbit axis each finger axis drives, its sense, and whether it may move (R4). */
export interface Roles {
  readonly xAxis: 0 | 1;
  readonly xSign: 1 | -1;
  readonly xOk: boolean;
  readonly yAxis: 0 | 1;
  readonly ySign: 1 | -1;
  readonly yOk: boolean;
}

/** ⭐ The roles from the two axes' screen directions (each `[right, up]`, any length — 0: none). */
export function rolesFor(a0: readonly [number, number], a1: readonly [number, number], minCos: number = ROLE_MIN_COS): Roles {
  const unit = (a: readonly [number, number]): [number, number] => {
    const l = Math.hypot(a[0], a[1]);
    return l > 1e-12 ? [a[0] / l, a[1] / l] : [0, 0];
  };
  const u0 = unit(a0);
  const u1 = unit(a1);
  const zeroH = Math.abs(u0[0]) >= Math.abs(u1[0]);
  const x = zeroH ? u0 : u1;
  const y = zeroH ? u1 : u0;
  return {
    xAxis: zeroH ? 0 : 1,
    xSign: x[0] < 0 ? -1 : 1,
    xOk: Math.abs(x[0]) >= minCos,
    yAxis: zeroH ? 1 : 0,
    ySign: y[1] < 0 ? -1 : 1,
    yOk: Math.abs(y[1]) >= minCos,
  };
}

/** ⭐ The finger (`fx` right, `fy` up — any unit) into the two orbit axes' steps (the same unit), by the roles. */
export function stepsFor(r: Roles, fx: number, fy: number): [number, number] {
  const s: [number, number] = [0, 0];
  if (r.xOk) s[r.xAxis] += r.xSign * fx;
  if (r.yOk) s[r.yAxis] += r.ySign * fy;
  return s;
}

/** ⭐ The finger components held (R4): the sign each was moving with when held, 0 when free. */
export interface FingerHold {
  readonly x: -1 | 0 | 1;
  readonly y: -1 | 0 | 1;
}
export const HOLD_NONE: FingerHold = { x: 0, y: 0 };

const sgn = (v: number): -1 | 0 | 1 => (v > 0 ? 1 : v < 0 ? -1 : 0);

/** ⭐ (§21.6) What the finger does to the gizmo on a face: the face's world normal, the gizmo's world direction for a finger right (`mx`) and up (`my`) —
 * unit, `null` where that component drives nothing. */
export interface FingerMotion {
  readonly n: Vec3;
  readonly mx: Vec3 | null;
  readonly my: Vec3 | null;
}

/**
 * ⭐⭐⭐ R4 (the owner: *"if the delta position would drive the gizmo in an opposite direction, hold the input … this overrules anything else"*) — at a
 * change of the finger's motion (a crossing, the roll mark, a frame turn) with the finger moving (`fx`, `fy`): a component is HELD when the gizmo it drove
 * along `prev.m` would now go the OPPOSITE way — the new face's direction UNFOLDED onto the old one about their edge (`shortestArc(next.n, prev.n)`), so
 * the dihedral never reads as a reversal — and REVERSED means turned past 120° (`HOLD_REVERSED_COS`): a quarter roll's 90° is R3's roles read again (dx
 * then runs along the edge), never a hold (⛔ `dot < 0`: at exactly 90° rounding decided, a dx held for good — probed). Held ones stay so. ⭐⭐⭐ (2026-11-05, §21.6) In the WORLD, never in the orbit's axes: ⛔ v2 compared the roles
 * (which orbit axis, which sign) — a frame turned on the same face renamed the axes, the dx was held with the gizmo going the finger's way on the screen,
 * the finger never reversing it: the 900-frame stalls (probed).
 */
/** ⭐ (§21.6) A finger component's motion counts as REVERSED when turned past 120° (cos −½) — a half roll (180°) is, a quarter roll (90°) is not. */
export const HOLD_REVERSED_COS = -0.5;

export function holdByMotion(prev: FingerMotion, next: FingerMotion, fx: number, fy: number, h: FingerHold): FingerHold {
  const q = shortestArc(next.n, prev.n);
  const opposite = (a: Vec3 | null, b: Vec3 | null, s: number): boolean => s !== 0 && a !== null && b !== null && dot(a, qRotate(q, b)) < HOLD_REVERSED_COS;
  return {
    x: h.x !== 0 ? h.x : opposite(prev.mx, next.mx, fx) ? sgn(fx) : 0,
    y: h.y !== 0 ? h.y : opposite(prev.my, next.my, fy) ? sgn(fy) : 0,
  };
}

/** ⭐ The finger through the hold: a held component passes nothing while it keeps its sign; reversed, it is released and passes. */
export function throughHold(h: FingerHold, fx: number, fy: number): { readonly fx: number; readonly fy: number; readonly h: FingerHold } {
  const rx = h.x !== 0 && sgn(fx) === -h.x;
  const ry = h.y !== 0 && sgn(fy) === -h.y;
  const x: -1 | 0 | 1 = rx ? 0 : h.x;
  const y: -1 | 0 | 1 = ry ? 0 : h.y;
  return { fx: x !== 0 ? 0 : fx, fy: y !== 0 ? 0 : fy, h: x === h.x && y === h.y ? h : { x, y } };
}
