/**
 * ⭐⭐ **THE IDLE ORBIT** (2026-11-14; `40_RENDER_SCENE/spec/ANIMATION.md` §4 — a MODULE: removable). The owner, with a screen video (…081353):
 * *"a very subtle camera orbit around the scene … whenever the player is inactive for xx seconds, such small camera orbit triggers on: it will
 * small orbit around the current camera position; it will trigger off when the player inputs something in the scene (not menu nor UI) and the
 * camera will catch back its game position with mm of input or ms (if the input is not delta position)"*.
 *
 * Measured on the video (the tray and floor tracked, 30 fps): a CLOSED loop of ≈ 6.8 s; the image drifts ≈ −13 / +3 px across and ± 4 px up
 * and down of 1140, turns ≈ 1°, breathes ± 1 % — a small yaw and a smaller pitch round the subject, smooth, never a jerk.
 *
 * Pure functions of time (engine-free): an ELLIPSE of yaw × pitch offsets round the camera's game angles, faded in from 0 (slow in — no jump at
 * the start), and the CATCH BACK: the offset shrinks to 0 in proportion to the finger's travel (`catchMm`), or in time (`catchMs`) for an input
 * without a delta (a tap, a press held still, a wheel). ⛔ The game's own camera is never touched: the wiring adds the offset for the draw only.
 */

export interface IdleOrbitConfig {
  /** Inactivity before it starts (s). */
  readonly afterS: number;
  /** The yaw swing, each side (degrees). */
  readonly yawDeg: number;
  /** The pitch swing, each side (degrees). */
  readonly pitchDeg: number;
  /** One loop (s). */
  readonly periodS: number;
  /** The fade in (s). */
  readonly fadeInS: number;
  /** The finger travel over which the camera catches back its game position (mm). */
  readonly catchMm: number;
  /** The time it takes for an input without a delta (ms). */
  readonly catchMs: number;
}

export const IDLE_ORBIT_DEFAULT: IdleOrbitConfig = {
  afterS: 4, // the owner: "from 10s to 5s", then "from 5 s to 4 s"
  yawDeg: 1.2,
  pitchDeg: 0.5,
  periodS: 6.8, // the video's loop
  fadeInS: 2,
  catchMm: 12, // the browsed centre's travel (`browseArriveMm`)
  catchMs: 300,
};

const smooth = (x: number): number => (x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x));

/** ⭐ The offset (radians) `t` seconds into the idle orbit: an ellipse round the game angles, faded in from exactly 0. */
export function idleOffset(t: number, cfg: IdleOrbitConfig): { yaw: number; pitch: number } {
  if (t <= 0) return { yaw: 0, pitch: 0 };
  const e = smooth(t / Math.max(1e-6, cfg.fadeInS));
  const w = (2 * Math.PI * t) / Math.max(1e-6, cfg.periodS);
  const k = Math.PI / 180;
  return { yaw: cfg.yawDeg * k * Math.sin(w) * e, pitch: cfg.pitchDeg * k * Math.cos(w) * e };
}

/**
 * ⭐ The CATCH BACK's progress (0 → 1): by the finger's travel when it moved (proportional, like the browsed centre — never by time then); by time
 * while it has not moved (an input without a delta). Never goes back.
 */
export function catchProgress(prev: number, travelledMm: number, sinceInputMs: number, cfg: IdleOrbitConfig): number {
  const p = travelledMm > 0 ? travelledMm / Math.max(1e-6, cfg.catchMm) : sinceInputMs / Math.max(1e-6, cfg.catchMs);
  return Math.min(1, Math.max(prev, p));
}

/** The offset while catching back: the one held at the input, shrunk linearly to 0. */
export function caughtOffset(held: { yaw: number; pitch: number }, progress: number): { yaw: number; pitch: number } {
  const k = 1 - Math.min(1, Math.max(0, progress));
  return { yaw: held.yaw * k, pitch: held.pitch * k };
}
