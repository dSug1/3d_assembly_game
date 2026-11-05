/**
 * ⭐⭐⭐ (2026-11-05, `TILTED_ORBIT_REBUILD_SCOPE.md` §21.4 R1 / R4) **THE FINGER READ ON THE SCREEN**: the orbit's two axes (0: the yaw, 1: the pitch, in the
 * orbit's frame) each move the gizmo along one of the two sections; on the screen each step goes some way (`screen`: its direction, right / up). The axis
 * whose screen direction is the more HORIZONTAL is dx's (the green), the other dy's (the red) — so a line may change colour after a roll — each taken in
 * the sense that moves the gizmo the FINGER's way (I5: dx right → the gizmo right, dy up → up). R4: an axis whose screen direction lies too far off its
 * finger axis (beyond `ROLE_MIN_COS` — mid-roll, a role just swapped) is STOPPED until the input changes; a test at every step, never a latch.
 * ⛔ ENGINE-FREE.
 */

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
