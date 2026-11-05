/**
 * ⭐⭐⭐ (2026-11-05, `TILTED_ORBIT_REBUILD_SCOPE.md` §21.4 R1 / R4) **THE FINGER READ ON THE SCREEN**: the orbit's two axes (0: the yaw, 1: the pitch, in the
 * orbit's frame) each move the gizmo along one of the two sections; on the screen each step goes some way (`screen`: its direction, right / up). The axis
 * whose screen direction is the more HORIZONTAL is dx's (the green), the other dy's (the red) — so a line may change colour after a roll — each taken in
 * the sense that moves the gizmo the FINGER's way (I5: dx right → the gizmo right, dy up → up). R4: an axis whose screen direction lies too far off its
 * finger axis (beyond `ROLE_MIN_COS`) passes nothing.
 * ⭐⭐⭐ (§21.5 F4) the roles are a FACE's — read once, at the crossing onto it, from its own square view (never the rolling camera's: §21.5 cause 5);
 * ⭐⭐⭐ (§21.5 F1, the owner: *"if the delta position would drive the gizmo in an opposite direction, hold the input … this overrules anything else"*)
 * R4's HOLD (`holdAtCrossing`, `throughHold`): at a face change, a finger component that the new roles would send the OPPOSITE way along the axis it
 * was driving — or onto the other axis — is HELD: it passes nothing until it reverses (or the drag ends); the other component goes on.
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

/** ⭐ The finger components held (R4): the sign each was moving with when held, 0 when free. */
export interface FingerHold {
  readonly x: -1 | 0 | 1;
  readonly y: -1 | 0 | 1;
}
export const HOLD_NONE: FingerHold = { x: 0, y: 0 };

const sgn = (v: number): -1 | 0 | 1 => (v > 0 ? 1 : v < 0 ? -1 : 0);

/**
 * ⭐⭐⭐ AT A FACE CHANGE (`prev` → `next` roles) with the finger moving (`fx`, `fy` — what each component was passing): a component is held when the new
 * roles would drive it on ANOTHER orbit axis or the OPPOSITE way along its own — the gizmo would reverse or turn under a finger kept on. Held ones stay so.
 */
export function holdAtCrossing(prev: Roles, next: Roles, fx: number, fy: number, h: FingerHold): FingerHold {
  const sx = sgn(fx);
  const sy = sgn(fy);
  const turns = (pa: 0 | 1, ps: number, pOk: boolean, na: 0 | 1, ns: number, s: number): boolean => s !== 0 && pOk && (na !== pa || ns * s !== ps * s);
  return {
    x: h.x !== 0 ? h.x : turns(prev.xAxis, prev.xSign, prev.xOk, next.xAxis, next.xSign, sx) ? sx : 0,
    y: h.y !== 0 ? h.y : turns(prev.yAxis, prev.ySign, prev.yOk, next.yAxis, next.ySign, sy) ? sy : 0,
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
