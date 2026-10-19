/**
 * ⭐⭐⭐ prototype (2026-10-19, the owner: *"for the 2D curve when the face supporting the gizmo is horizontal, there is a moment between ring 2 and ring 3
 * where the camera goes to the azimuth and rolls to the other side of the assembly: during this interval, the angular speed (degrees per mm of input
 * delta) is peaking. Can you smoothen the peak by reducing this angular speed so that the travel of the camera is gentler ?"* → *"build it. add a slider
 * in the camera orbit around center so I can adjust the governor degree/mm. Also slow the view between rings 2 and 3 on vertical faces: make another
 * slider for that."*) — **THE TURN GOVERNOR**: the curve and the piece's places are unchanged; only how much ring a millimetre of dy buys is. Where the
 * camera would turn faster than the cap (its whole frame — view and roll together — per mm of finger), the dy gain is lowered just enough to hold it at the
 * cap; elsewhere it is untouched (rings 1 and 4 as before). ⭐ Measured before, at the shipped gains (dy → 0.0129 of the ring per mm): the whole frame's
 * turn peaked at 96°/mm over a horizontal face (the top roll's band) and 20°/mm on a vertical face (the view between rings 2 and 3).
 * ⛔ ENGINE-FREE.
 */
import type { Vec3 } from "../core/vec";

/** ⭐ The camera's frame at a ring place: its view direction and up (unit). */
export interface TurnFrame {
  readonly dir: Vec3;
  readonly up: Vec3;
}

/** ⭐ The step the rate is read over (ring parameter). */
const RATE_STEP_V = 1e-3;
/** ⭐ The least share of the finger's travel the governor keeps (a turn never stalls). */
export const GOVERNOR_MIN_SHARE = 0.02;

const dot = (a: Vec3, b: Vec3): number => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a: Vec3, b: Vec3): Vec3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];

/** ⭐ The angle (°) the camera's whole frame turns from `a` to `b` — the rotation carrying one onto the other (view, up and right together). */
export function frameTurnDeg(a: TurnFrame, b: TurnFrame): number {
  const ra = cross(a.up, a.dir);
  const rb = cross(b.up, b.dir);
  const tr = dot(a.dir, b.dir) + dot(a.up, b.up) + dot(ra, rb);
  return (Math.acos(Math.max(-1, Math.min(1, (tr - 1) / 2))) * 180) / Math.PI;
}

/** ⭐ How fast the camera turns at ring place `v`, in degrees per unit of the ring parameter (`frameAt`: the frame the orbit asks for there). */
export function turnRatePerV(frameAt: (v: number) => TurnFrame, v: number): number {
  const lo = Math.max(0, v - RATE_STEP_V);
  const hi = Math.min(1, v + RATE_STEP_V);
  if (!(hi > lo)) return 0;
  return frameTurnDeg(frameAt(lo), frameAt(hi)) / (hi - lo);
}

/** ⭐ The finger's travel is walked in pieces of at most this (mm) — the rate read afresh on each (a pointer event can be ~0.3 mm). */
export const GOVERNOR_PIECE_MM = 0.1;

/**
 * ⭐⭐ The governed ring step: the finger asks for `dv` (ring parameter, from `v`), at `dvPerMm` of ring a millimetre of dy; at most `capDegMm` of camera
 * turn per millimetre — walked in pieces of `GOVERNOR_PIECE_MM`, each at the share `min(1, cap / (rate × dvPerMm))` read at the piece's middle (a first
 * estimate's), never below `GOVERNOR_MIN_SHARE`.
 */
export function governedRingStep(frameAt: (v: number) => TurnFrame, v: number, dv: number, dvPerMm: number, capDegMm: number): number {
  if (dv === 0 || !(dvPerMm > 0) || !(capDegMm > 0)) return dv;
  const share = (at: number): number => {
    const degPerMm = turnRatePerV(frameAt, Math.min(1, Math.max(0, at))) * dvPerMm;
    return degPerMm > capDegMm ? Math.max(GOVERNOR_MIN_SHARE, capDegMm / degPerMm) : 1;
  };
  const mm = Math.abs(dv) / dvPerMm;
  const n = Math.max(1, Math.ceil(mm / GOVERNOR_PIECE_MM - 1e-9));
  const piece = dv / n;
  let at = v;
  for (let i = 0; i < n; i++) {
    const first = share(at);
    at += piece * share(at + (piece * first) / 2);
  }
  return at - v;
}
