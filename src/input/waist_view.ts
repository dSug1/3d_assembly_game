/**
 * ⭐⭐⭐ prototype — **THE SLIDE VIEW BETWEEN RINGS 2 AND 3** (2026-10-17, the owner: *"Modify the 2D curve as well as the position of the rings so that
 * during the travel between the 2nd ring and the 3rd ring the camera positions itself so that the view is nearly isometric (i.e. same
 * nearest-corner-with-gravity-direction-aligned-with-screen-vertical-direction isometric view as during the slide,). … The way in and way out shall be
 * smooth, copied from what is currently existing. If 180 degrees camera turns are required in some configurations, implement something similar as what
 * is currently existing when hosting face is horizontal, so that there is no Z-shape movement of the green piece in the screen."* → *"12 mm outside rings
 * 2–3"*, the corner turn: *"build both and make a slider to select which in the submenu CAMERA ORBIT AROUND CENTER"*).
 *
 * ⭐ Between rings 2 and 3 the camera holds the SLIDE VIEW: the face's isometric corner `(n ± t1 ± t2)/√3` (35° off the face, `HOVER.md` §14), upright
 * (`uprightBlend`), looking at the PIECE (centred — no Z by construction), at its own distance — ⭐ LATCHED all along the curve with the gizmo on a
 * face (`waistLatchWeight`; ⛔ first over 12 mm of finger outside rings 2–3 — an S on rings 1 and 4), by the slide view's arc (`hoverCameraSwing`). The FACE here is the turned curve's halfway direction at the
 * orbit's yaw (`rigPlace` at `waistV`) — the hosting face's normal at the yaw the gizmo was set, swung by dx (so dx still orbits the view).
 * Its axes are gravity's: `t1` level across the face, `t2 = n × t1` (on a level face `t1` is level across the camera's heading). Two corners: the one
 * nearest the curve's camera at ring 2 (`A`) and at ring 3 (`B`); where they differ the camera either TURNS from one to the other about the face's
 * normal across rings 2 → 3 (`waistCornerTurn` 1, smoothstep — the top face's swing, the piece centred) or KEEPS the corner it entered by (0).
 * The rings themselves are unchanged (the piece's path is the same — only the camera moves).
 * ⛔ ENGINE-FREE.
 */
import type { GestureConfig } from "./gestureConfig";
import { fourRingLayout } from "./orbit";
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
 * ⭐⭐⭐ (2026-10-17, the owner: *"during its travel on ring 1 or 4, the piece does a S-shape travel. I would prefer the way in and way out of the
 * semi-isometric view latch since the beginning of the travel so that there is no S-shape travel"* → *"build 1 following my suggestion"*) — **LATCHED
 * ALL ALONG THE CURVE**: the slide view's weight is the gizmo's being on a FACE — blended by its own change (`rigShare`) — at every ring, never by the
 * ring parameter. ⛔ A ramp by `v` over 12 mm outside rings 2–3: the aim slid from the gizmo to the piece while the view arced — the S on rings 1 and 4.
 * ⚠ The cost, accepted: far out (ring 1 or 4, up to 6 m off) the view is aimed at the piece and the assembly may be off the screen.
 */
export function waistLatchWeight(fromFaced: boolean, toFaced: boolean, share: number): number {
  if (share >= 1) return toFaced ? 1 : 0;
  const s = Math.max(0, share);
  return (fromFaced ? 1 - s : 0) + (toFaced ? s : 0);
}

/** ⭐ (2026-10-17) the corner a dipping corner is tilted back to — its least height over the real face (sin ≈ 10°). */
export const FRONT_MIN = 0.17;

/**
 * ⭐⭐⭐ (2026-10-17, the owner: *"if the hosting face is vertical and the travel starts with a camera view close to the edge of the hosting face, the
 * semi-isometric view can push the camera on the other side of the hosting face from the piece"* → *"build 3"*) — the corner's side ACROSS the face: the
 * one IN FRONT of the face as tapped (`n0`) — its `t1` toward `n0`; across a level face nothing to choose: `fallback` (the camera's yaw offset side).
 * ⛔ The yaw offset's side alone: once dx swung the curve's halfway direction past ~35° toward the face's edge, that corner stood behind the real face.
 */
export function frontSide(f: { t1: Vec3 }, n0: Vec3, fallback: number): number {
  const k = dot(f.t1, n0);
  return Math.abs(k) > 1e-6 ? Math.sign(k) : fallback;
}

/** ⭐ A view direction kept IN FRONT of the face as tapped: one dipping below `FRONT_MIN` over it is tilted back to it (on the plane of it and `n0`). */
export function keepInFront(d: Vec3, n0: Vec3): Vec3 {
  const n = unit(n0);
  if (n === null) return d;
  const k = dot(d, n);
  if (k >= FRONT_MIN) return d;
  const flat = unit([d[0] - k * n[0], d[1] - k * n[1], d[2] - k * n[2]]);
  if (flat === null) return d;
  const c = Math.sqrt(1 - FRONT_MIN * FRONT_MIN);
  return [flat[0] * c + n[0] * FRONT_MIN, flat[1] * c + n[1] * FRONT_MIN, flat[2] * c + n[2] * FRONT_MIN];
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

/**
 * ⭐ The corner the camera ENTERED rings 2–3 by (for `waistCornerTurn` 0): re-read whenever the piece is outside them — above ring 2 `A`, below ring 3
 * `B` — and kept across them (first seen inside: the nearer ring's). ⛔ Latched once along a whole curve (the view latched all along), it froze.
 */
export function waistEntryNext(prev: "A" | "B" | null, v: number, v2: number, v3: number): "A" | "B" {
  if (v > v2) return "A";
  if (v < v3) return "B";
  return prev ?? (v >= (v2 + v3) / 2 ? "A" : "B");
}
