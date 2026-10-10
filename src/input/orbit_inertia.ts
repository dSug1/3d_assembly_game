/**
 * ⭐⭐ prototype (green box) — **THE GREEN PIECE'S ORBIT HAS INERTIA** (the owner, 2026-10-02: *"give some inertia to the orbit
 * based on the piece overall volume. add a slider for orbit inertia gain"* — and, asked which: *"the green piece's orbit"*).
 *
 * ⭐ While the finger drags, the orbit's yaw and elevation steps are RECORDED with their time; when the finger LIFTS, the orbit
 * goes on at the rate it had over the last `RELEASE_WINDOW_MS` (a finger that had stopped before lifting carries nothing), and
 * slows EXPONENTIALLY with a time constant `τ = gain × volume` — a heavier piece (more volume, more mass) coasts further. Any new
 * touch stops it (the caller's job). ⛔ The elevation stops at its rings (`OrbitController` clamps it); the yaw coasts on.
 *
 * ⛔ ENGINE-FREE.
 */

/** ⭐ How far back the release speed is measured, ms — about one or two pointer events on the tablet (47–68 ms apart). */
export const RELEASE_WINDOW_MS = 80;
/** ⭐ Below this rate (rad/ms, or elevation /ms) the coast is over. */
const REST = 1e-7;

/** ⭐ The coast's time constant, ms: the gain (ms per cm³) × the piece's volume (m³ → cm³). `0`: no inertia. */
export function inertiaTauMs(volumeM3: number, gainMsPerCm3: number): number {
  return Math.max(0, gainMsPerCm3) * Math.max(0, volumeM3) * 1e6;
}

/** ⭐ A frustum's volume — a box `w × h × d` whose top face is scaled by `topScale` (the green pyramid, `Scene_0`'s): `h·A·(1+s+s²)/3`. */
export function frustumVolumeM3(w: number, h: number, d: number, topScale: number): number {
  return (h * w * d * (1 + topScale + topScale * topScale)) / 3;
}

export class OrbitInertia {
  private steps: { t: number; dYaw: number; dV: number }[] = [];
  private velYaw = 0;
  private velV = 0;

  /** ⭐ A drag step the finger made: the orbit's change, at time `t` (ms). */
  record(t: number, dYaw: number, dV: number): void {
    this.steps.push({ t, dYaw, dV });
    while (this.steps.length > 0 && t - this.steps[0]!.t > RELEASE_WINDOW_MS) this.steps.shift();
    this.velYaw = 0;
    this.velV = 0;
  }

  /** ⭐ The finger lifted at `t`: the coast starts at the rate of the steps inside the window before it. */
  release(t: number): void {
    // ⛔ STRICTLY inside: a step is the motion of the interval ENDING at its time, so the window `(t − W, t]` holds exactly W ms
    // of motion. ⚠ With `<=` a steady drag every 16 ms put 6 steps (96 ms of motion) into 80 ms — the coast ran 20 % too fast.
    const inWindow = this.steps.filter((s) => t - s.t < RELEASE_WINDOW_MS);
    this.steps = [];
    let y = 0;
    let v = 0;
    for (const s of inWindow) {
      y += s.dYaw;
      v += s.dV;
    }
    this.velYaw = y / RELEASE_WINDOW_MS;
    this.velV = v / RELEASE_WINDOW_MS;
  }

  /** ⭐ A new touch: the coast stops at once. */
  stop(): void {
    this.steps = [];
    this.velYaw = 0;
    this.velV = 0;
  }

  get coasting(): boolean {
    return Math.abs(this.velYaw) > REST || Math.abs(this.velV) > REST;
  }

  /**
   * ⭐ One frame of coast: the orbit change to apply, then the speed decays by `exp(−dt/τ)` — the EXACT integral of the decaying
   * speed over the frame, so the total coast is `v₀·τ` whatever the frame rate. `tauMs ≤ 0`: no coast.
   */
  step(dtMs: number, tauMs: number): { dYaw: number; dV: number } {
    if (!(tauMs > 0) || !this.coasting) {
      this.velYaw = 0;
      this.velV = 0;
      return { dYaw: 0, dV: 0 };
    }
    const k = Math.exp(-dtMs / tauMs);
    const travelled = tauMs * (1 - k);
    const out = { dYaw: this.velYaw * travelled, dV: this.velV * travelled };
    this.velYaw *= k;
    this.velV *= k;
    if (!this.coasting) {
      this.velYaw = 0;
      this.velV = 0;
    }
    return out;
  }
}

/**
 * ⭐⭐ prototype (green box) — **THE CAMERA HEARS THE RELEASE ONLY WHEN THE COAST IS OVER** (the owner, 2026-10-02: *"sometimes,
 * when the inertia is big and there is a large orbit, there is a jump of the green piece back and forth at one point of the
 * orbit"*). ⛔ The finger's lift was handed to the camera at once (`cameraOrbitStep`'s `released`), while the orbit was still
 * COASTING: for that one frame the camera ran its "input stopped" rule — a glide toward where the rig was heading, ahead of the
 * eased green piece — and the next frame, the rig still moving, the leash pinned it back: the piece jumped ~0.36° on the glass
 * and back, at the point of the orbit where the finger had lifted. ✅ While the orbit coasts the release is HELD (`pending`), and
 * delivered on the first frame it does not — so the camera follows a coasting orbit exactly as a dragging one, and the
 * release catch-up still runs once it has stopped.
 */
export function cameraRelease(fingerLifted: boolean, coasting: boolean, pending: boolean): { release: boolean; pending: boolean } {
  const waiting = pending || fingerLifted;
  if (!waiting) return { release: false, pending: false };
  return coasting ? { release: false, pending: true } : { release: true, pending: false };
}
