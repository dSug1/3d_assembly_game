/**
 * ⭐⭐ **THE CAMERA ORBITS AFTER THE GREEN BOX** (prototype, the owner, 2026-09-30): *"the inputs control the orbits of both
 * green box and camera — green box orbit as current — camera orbit: twice the radius and the height as green box orbit —
 * the camera orbits only if the green box has orbited beyond 15 degrees yaw amplitude and or 15 degrees pitch amplitude
 * vs. the camera orbit — when a delta input stops (dx and or dy) the camera orbit still continue to orbit to align the
 * camera orbit position on this input (dx and or dy) to the green box orbit"*; and *"the camera looks at the yellow target
 * (orbit center)"*.
 *
 * ⭐ Two orbits about one centre. The BOX is the rig (yaw, ring parameter `v`). The CAMERA has its own (yaw, `v`), placed
 * at TWICE the rig's offset — twice the radius, twice the height. Per axis:
 * * **a LEASH**: while the box is within `leashRad` of the camera the camera stays; past it, the camera is dragged along,
 *   `leashRad` behind;
 * * **a SETTLE**: once that axis has not moved for `settleDelayMs` (the input stopped on it), the camera keeps orbiting on
 *   that axis until it is aligned with the box (an exponential, `settleTauMs` — retargeting is free).
 * ⭐ Yaw is compared the short way round; PITCH as the true angle `atan2(height, radius)` of each ring point — `v` is a ring
 * parameter, not an angle — and mapped back by bisection (the rings make it monotone).
 *
 * ⛔ ENGINE-FREE.
 */
import type { Vec3 } from "../core/vec";
import type { GestureConfig } from "./gestureConfig";
import { orbitOffset } from "./orbit";

/** One orbit position: yaw (radians) and the ring parameter `v` in [0, 1]. */
export interface OrbitAt {
  readonly yaw: number;
  readonly v: number;
}

export interface CameraOrbitState {
  readonly cam: OrbitAt;
  /** The box's orbit last frame — to tell which axis moved. */
  readonly lastBox: OrbitAt;
  readonly yawMovedAt: number;
  readonly pitchMovedAt: number;
}

export interface CameraOrbitParams {
  readonly leashRad: number;
  readonly settleTauMs: number;
  readonly settleDelayMs: number;
}

/** ⭐ The short way round, in (−π, π]. */
export function wrapPi(a: number): number {
  const t = ((((a + Math.PI) % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI)) - Math.PI;
  return t === -Math.PI ? Math.PI : t;
}

/** ⭐ The true pitch of a ring point: `atan2(height, radius)` (zoom does not change it). */
export function pitchOf(cfg: GestureConfig, v: number): number {
  const o = orbitOffset(cfg, 0, v, 1).offsetM;
  return Math.atan2(o[1], Math.hypot(o[0], o[2]));
}

/** ⭐ The ring parameter at a pitch — bisection over [0, 1], clamped to the rings. */
export function vForPitch(cfg: GestureConfig, pitch: number): number {
  let lo = 0;
  let hi = 1;
  const pLo = pitchOf(cfg, lo);
  const pHi = pitchOf(cfg, hi);
  const rising = pHi >= pLo;
  if (rising ? pitch <= pLo : pitch >= pLo) return lo;
  if (rising ? pitch >= pHi : pitch <= pHi) return hi;
  for (let i = 0; i < 40; i++) {
    const mid = (lo + hi) / 2;
    const p = pitchOf(cfg, mid);
    if (rising ? p < pitch : p > pitch) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
}

const ease = (dtMs: number, tauMs: number): number => (tauMs > 0 ? 1 - Math.exp(-Math.max(0, dtMs) / tauMs) : 1);

/** ⭐ The camera orbit starts aligned with the box. */
export function cameraOrbitAt(box: OrbitAt, nowMs: number): CameraOrbitState {
  return { cam: box, lastBox: box, yawMovedAt: nowMs, pitchMovedAt: nowMs };
}

/** ⭐ One frame: each axis leashed while the box moves on it, settled once it has stopped. */
export function cameraOrbitStep(
  s: CameraOrbitState,
  box: OrbitAt,
  nowMs: number,
  dtMs: number,
  cfg: GestureConfig,
  p: CameraOrbitParams,
  /**
   * ⭐ What the INPUT drives — the raw rig — read to tell which axis moved. Default: the box itself. ⛔ Not the smoothed
   * box: its ease creeps on after the finger stops, and would hold the settle off for a second.
   */
  driver: OrbitAt = box,
): CameraOrbitState {
  const yawMovedAt = Math.abs(wrapPi(driver.yaw - s.lastBox.yaw)) > 1e-9 ? nowMs : s.yawMovedAt;
  const pitchMovedAt = Math.abs(driver.v - s.lastBox.v) > 1e-9 ? nowMs : s.pitchMovedAt;
  const k = ease(dtMs, p.settleTauMs);

  // yaw
  let yaw = s.cam.yaw;
  const dy = wrapPi(box.yaw - yaw);
  if (Math.abs(dy) > p.leashRad) yaw = box.yaw - Math.sign(dy) * p.leashRad;
  else if (nowMs - yawMovedAt >= p.settleDelayMs) yaw += dy * k;

  // pitch — as a true angle
  let v = s.cam.v;
  const pb = pitchOf(cfg, box.v);
  const pc = pitchOf(cfg, v);
  const dp = pb - pc;
  if (Math.abs(dp) > p.leashRad) v = vForPitch(cfg, pb - Math.sign(dp) * p.leashRad);
  else if (nowMs - pitchMovedAt >= p.settleDelayMs) v = vForPitch(cfg, pc + dp * k);

  return { cam: { yaw, v }, lastBox: driver, yawMovedAt, pitchMovedAt };
}

/** ⭐ The camera's offset from the orbit centre: TWICE the rig's — twice the radius and the height. */
export function cameraOffset(cfg: GestureConfig, cam: OrbitAt, zoom: number): Vec3 {
  const o = orbitOffset(cfg, cam.yaw, cam.v, zoom).offsetM;
  return [o[0] * 2, o[1] * 2, o[2] * 2];
}

/** ⭐ An orbit position with its zoom — what the green box eases along. */
export interface OrbitZoom extends OrbitAt {
  readonly zoom: number;
}

/**
 * ⭐⭐ **THE BOX EASES AFTER THE RIG** (the owner: *"why the movement of the camera is fluid while the movement of the green
 * box is jerky?"* — *"add it"*). The rig changes only when a pointer event arrives (~15–20 a second on the tablet, `D86`),
 * so a box placed straight on it jumps and holds; eased every frame toward it — yaw the short way, the ring parameter and
 * the zoom — it moves continuously, and stays on its orbit. ⚠ Cost: about `tauMs` of lag behind the finger.
 */
export function easeOrbit(cur: OrbitZoom, target: OrbitZoom, dtMs: number, tauMs: number): OrbitZoom {
  const k = ease(dtMs, tauMs);
  return {
    yaw: cur.yaw + wrapPi(target.yaw - cur.yaw) * k,
    v: cur.v + (target.v - cur.v) * k,
    zoom: cur.zoom * Math.pow(target.zoom / cur.zoom, k),
  };
}
