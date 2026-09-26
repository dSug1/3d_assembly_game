/**
 * ⭐⭐⭐ **THE UNSNAP GESTURE** — the owner, 2026-09-26:
 *
 * > *"To unsnap: first touch on pioneer object and second touch on follower object and one rapid
 * > zoom out movement (same sliders as eviction shake) or first right click hold on pioneer
 * > object + second left click hold on follower object + rapid delta position. This will maintain
 * > symmetry between mobile and desktop."* — corrected the same day; the first text had the
 * > tablet's order reversed.
 *
 * ⭐⭐ **FIRST THE PIONEER, SECOND THE FOLLOWER, THEN A RAPID MOVE** — the same on both devices,
 * which is what `unsnapCouple` reads: the held (first) body must be the Pioneer of the seated
 * (second) one. ⛔ The reverse order is not this gesture, and `pressMeaning` refuses it too.
 *
 * ⛔ Two readings of *rapid*, one per device, because the desktop's right-button touchpoint never
 * moves (`D94`): on the tablet the SEPARATION of the two fingers must GROW by `legMm` within
 * `windowMs` (*"zoom out"*); with a mouse the driven pointer must TRAVEL `legMm` within `windowMs`
 * (*"rapid delta position"*). ⭐ Both numbers are the eviction shake's own sliders
 * (`evictShakeLegMm`, `evictShakeWindowMs`) — *"same sliders as eviction shake"* — so no new
 * tunable is authored here.
 *
 * ⛔ ENGINE-FREE.
 */
import type { GestureConfig } from "./gestureConfig";

export interface UnsnapParams {
  readonly legMm: number;
  readonly windowMs: number;
}

/** ⭐ The two numbers, read from the ONE config (`CONSTRAINTS` §4: imported, never copied). */
export function unsnapParamsFrom(cfg: GestureConfig): UnsnapParams {
  return { legMm: cfg.evictShakeLegMm, windowMs: cfg.evictShakeWindowMs };
}

/**
 * ⭐⭐ Which seated Follower does this pair of holders address? — `second` when it is SEATED and
 * `first` is its Pioneer; `null` for any other pair, including the reverse order.
 */
export function unsnapCouple(
  first: string,
  second: string,
  pioneerOf: (follower: string) => string | null,
  isSeated: (follower: string) => boolean,
): string | null {
  if (first === second) return null;
  if (!isSeated(second)) return null;
  return pioneerOf(second) === first ? second : null;
}

export interface ScalarSample {
  readonly t: number;
  readonly v: number;
}

/** Drop samples older than the window from the front. ⚠ Keeps the newest even if stale. */
function trim<S extends { readonly t: number }>(series: S[], nowMs: number, windowMs: number): void {
  while (series.length > 1 && nowMs - series[0]!.t > windowMs) series.shift();
}

/**
 * ⭐⭐ Has the series GROWN by `leg` within `windowMs`? — the tablet's *zoom out*.
 * ⚠ Growth from any earlier sample in the window to the latest one; a shrink-then-grow that
 * nets less than `leg` does not fire.
 */
export function grewWithin(
  series: readonly ScalarSample[],
  leg: number,
  windowMs: number,
): boolean {
  if (series.length < 2 || !(leg > 0)) return false;
  const last = series[series.length - 1]!;
  for (let i = 0; i < series.length - 1; i++) {
    const s = series[i]!;
    if (last.t - s.t > windowMs) continue;
    if (last.v - s.v >= leg) return true;
  }
  return false;
}

export interface PointSample {
  readonly t: number;
  readonly x: number;
  readonly y: number;
}

/** ⭐⭐ Has the point TRAVELLED `leg` from any sample within the window? — the mouse's *rapid delta*. */
export function travelledWithin(
  series: readonly PointSample[],
  leg: number,
  windowMs: number,
): boolean {
  if (series.length < 2 || !(leg > 0)) return false;
  const last = series[series.length - 1]!;
  for (let i = 0; i < series.length - 1; i++) {
    const s = series[i]!;
    if (last.t - s.t > windowMs) continue;
    if (Math.hypot(last.x - s.x, last.y - s.y) >= leg) return true;
  }
  return false;
}

/**
 * ⭐⭐⭐ The detector for ONE seated pair under two touchpoints. Feed it both touchpoints'
 * positions (in mm on the glass) every move; it answers `true` once, on the move that completes
 * the gesture, and stays quiet until `reset`.
 */
export class UnsnapDetector {
  private readonly separation: ScalarSample[] = [];
  private readonly travel: PointSample[] = [];
  private fired = false;

  constructor(
    private readonly params: UnsnapParams,
    /** ⭐ `"MOUSE"` reads the DRIVEN pointer's travel; `"TOUCH"` reads the pair's separation. */
    private readonly kind: "TOUCH" | "MOUSE",
  ) {}

  /**
   * @param a the first touchpoint's position, mm — on a mouse, the DRIVEN (left-button) pointer.
   * @param b the second touchpoint's position, mm — on a mouse, the right-button touchpoint.
   */
  push(t: number, a: { x: number; y: number }, b: { x: number; y: number }): boolean {
    if (this.fired) return false;
    if (this.kind === "MOUSE") {
      this.travel.push({ t, x: a.x, y: a.y });
      trim(this.travel, t, this.params.windowMs);
      if (travelledWithin(this.travel, this.params.legMm, this.params.windowMs)) {
        this.fired = true;
        return true;
      }
      return false;
    }
    this.separation.push({ t, v: Math.hypot(a.x - b.x, a.y - b.y) });
    trim(this.separation, t, this.params.windowMs);
    if (grewWithin(this.separation, this.params.legMm, this.params.windowMs)) {
      this.fired = true;
      return true;
    }
    return false;
  }

  reset(): void {
    this.separation.length = 0;
    this.travel.length = 0;
    this.fired = false;
  }
}
