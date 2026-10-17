/**
 * ⭐⭐⭐ prototype — **THE SLIDE VIEW BETWEEN RINGS 2 AND 3** (2026-10-17, the owner: *"Modify the 2D curve as well as the position of the rings so that
 * during the travel between the 2nd ring and the 3rd ring the camera positions itself so that the view is nearly isometric (i.e. same
 * nearest-corner-with-gravity-direction-aligned-with-screen-vertical-direction isometric view as during the slide,). … The way in and way out shall be
 * smooth, copied from what is currently existing. If 180 degrees camera turns are required in some configurations, implement something similar as what
 * is currently existing when hosting face is horizontal, so that there is no Z-shape movement of the green piece in the screen."* → *"12 mm outside rings
 * 2–3"*, the corner turn: *"build both and make a slider to select which in the submenu CAMERA ORBIT AROUND CENTER"*).
 *
 * ⭐ Between rings 2 and 3 the camera holds the SLIDE VIEW: the face's isometric corner `(n ± t1 ± t2)/√3` (35° off the face, `HOVER.md` §14), upright
 * (`uprightBlend`), looking at the PIECE (centred — no Z by construction), at its own distance; in and out over 12 mm of finger outside the rings (the
 * slide view's own span, `pieceOrbitEnterMm`), the slide view's arc (`hoverCameraSwing`). The FACE here is the turned curve's halfway direction at the
 * orbit's yaw (`rigPlace` at `waistV`) — the hosting face's normal at the yaw the gizmo was set, swung by dx (so dx still orbits the view).
 * Its axes are gravity's: `t1` level across the face, `t2 = n × t1` (on a level face `t1` is level across the camera's heading). Two corners: the one
 * nearest the curve's camera at ring 2 (`A`) and at ring 3 (`B`); where they differ the camera either TURNS from one to the other about the face's
 * normal across rings 2 → 3 (`waistCornerTurn` 1, smoothstep — the top face's swing, the piece centred) or KEEPS the corner it entered by (0).
 * The rings themselves are unchanged (the piece's path is the same — only the camera moves).
 * ⛔ ENGINE-FREE.
 */
import type { GestureConfig } from "./gestureConfig";
import { elevationGainScale, fourRingLayout } from "./orbit";
import type { Vec3 } from "../core/vec";

const unit = (a: Vec3): Vec3 | null => {
  const n = Math.hypot(a[0], a[1], a[2]);
  return n > 1e-12 ? [a[0] / n, a[1] / n, a[2] / n] : null;
};
const dot = (a: Vec3, b: Vec3): number => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a: Vec3, b: Vec3): Vec3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const smooth = (t: number): number => {
  const u = Math.min(1, Math.max(0, t));
  return u * u * (3 - 2 * u);
};

/** ⭐ The ring parameters of rings 2 (higher `v`) and 3 (numbered from the top). */
export function waistRings(cfg: GestureConfig): { v2: number; v3: number } {
  if (cfg.orbitLowerRingOn !== 1) return { v2: 0.5, v3: 0 };
  const f = fourRingLayout(cfg);
  return { v2: f.knots[2]! / f.total, v3: f.knots[1]! / f.total };
}

/**
 * ⭐⭐ How much of the slide view the camera takes at the ring parameter `v`: all of it between rings 2 and 3, none farther than 12 mm of finger
 * (`pieceOrbitEnterMm`, the slide view's own span, through the drag's elevation gain) outside them, smoothstep between.
 */
export function waistWeight(cfg: GestureConfig, v: number): number {
  const { v2, v3 } = waistRings(cfg);
  const span = Math.max(1e-6, cfg.pieceOrbitEnterMm * cfg.gainOrbitElevation * elevationGainScale(cfg));
  if (v >= v3 && v <= v2) return 1;
  if (v > v2) return 1 - smooth((v - v2) / span);
  return 1 - smooth((v3 - v) / span);
}

/** ⭐ The face's frame for the view: its normal `n`, `t1` level across it, `t2 = n × t1`; a level face takes `t1` across the camera's heading `levelHeading`. */
export function waistFrame(n0: Vec3, levelHeading: Vec3): { n: Vec3; t1: Vec3; t2: Vec3 } | null {
  const n = unit(n0);
  if (n === null) return null;
  // ⭐ CONTINUOUS as the face turns level (a gizmo change blends it): across the normal, plus a tenth of across the camera's heading — on a side face the
  // two agree (the camera faces it), on a level face the first vanishes (⛔ a switch at a threshold jumped the corner, 5 % of the screen in a frame)
  const a = cross([0, 1, 0], n);
  const h = cross([0, 1, 0], levelHeading);
  const raw: Vec3 = [a[0] + 0.1 * h[0], a[1] + 0.1 * h[1], a[2] + 0.1 * h[2]];
  const k = dot(raw, n); // kept IN the face's plane, whatever the heading
  const t1 = unit([raw[0] - k * n[0], raw[1] - k * n[1], raw[2] - k * n[2]]) ?? unit(h) ?? ([1, 0, 0] as Vec3);
  const t2 = unit(cross(n, t1)) ?? ([0, 1, 0] as Vec3);
  return { n, t1, t2 };
}

/** ⭐ The corner (its signs along `t1`, `t2`) nearest a camera direction `d` — a square tie takes +. */
export function nearestCorner(f: { t1: Vec3; t2: Vec3 }, d: Vec3): [number, number] {
  const s = (x: number): number => (Math.abs(x) < 1e-9 ? 1 : Math.sign(x));
  return [s(dot(d, f.t1)), s(dot(d, f.t2))];
}

/** ⭐ The view direction at the corner angle `phi` round the face's normal (`(n + √2 (cos φ t1 + sin φ t2)) / √3` — 35° off the face). */
export function cornerDirection(f: { n: Vec3; t1: Vec3; t2: Vec3 }, phi: number): Vec3 {
  const c = Math.SQRT2 * Math.cos(phi);
  const s = Math.SQRT2 * Math.sin(phi);
  const r = 1 / Math.sqrt(3);
  return [(f.n[0] + c * f.t1[0] + s * f.t2[0]) * r, (f.n[1] + c * f.t1[1] + s * f.t2[1]) * r, (f.n[2] + c * f.t1[2] + s * f.t2[2]) * r];
}

const angleOf = (c: readonly [number, number]): number => Math.atan2(c[1], c[0]);
const wrapPi = (a: number): number => a - 2 * Math.PI * Math.round(a / (2 * Math.PI));

/**
 * ⭐⭐⭐ The view direction at `v` between corners `a` (ring 2's) and `b` (ring 3's): TURNING (`turn`) — from `a` at ring 2 to `b` at ring 3 about the
 * face's normal, the short way (half a round: always the + way), smoothstep — or KEEPING the corner it entered by (`entry`; `null`: the nearer ring's).
 */
export function waistDirection(
  cfg: GestureConfig,
  f: { n: Vec3; t1: Vec3; t2: Vec3 },
  a: readonly [number, number],
  b: readonly [number, number],
  v: number,
  turn: boolean,
  entry: "A" | "B" | null,
): Vec3 {
  const { v2, v3 } = waistRings(cfg);
  const pa = angleOf(a);
  const pb = angleOf(b);
  if (!turn) {
    const which = entry ?? (v >= (v2 + v3) / 2 ? "A" : "B");
    return cornerDirection(f, which === "A" ? pa : pb);
  }
  let d = wrapPi(pb - pa);
  if (Math.abs(Math.abs(d) - Math.PI) < 1e-9) d = Math.PI;
  const share = smooth((v2 - v) / Math.max(1e-9, v2 - v3));
  return cornerDirection(f, pa + d * share);
}

/** ⭐ The corner the camera ENTERED by (for `waistCornerTurn` 0): latched as the slide view starts — from above ring 2 `A`, below ring 3 `B` — and dropped once it is gone. */
export function waistEntryNext(prev: "A" | "B" | null, weight: number, v: number, vMid: number): "A" | "B" | null {
  if (!(weight > 0)) return null;
  return prev ?? (v >= vMid ? "A" : "B");
}
