/**
 * §1.3 — ROLL DETECTION (rule 2quinte), running inside `COMMITTED_CONTINUOUS`.
 *
 * ⛔⛔ THE SPEC'S READING CANNOT FIRE AT `rollAngle`, AND THIS IS THE DEPARTURE.
 * §1.3 asks for *"signed angle accumulated about the running centroid of the path"*.
 * **The centroid of an ARC is not its centre.** For a uniform arc of total angle
 * `2α` at radius `R`, the centroid sits at `R·sin(α)/α` from the true centre — so at
 * the 60° `rollAngle` wants to commit at, the running centroid is at **0.955 R**:
 * essentially ON the path, not at its centre. The angle measured about it is not the
 * swept angle at all; it only becomes one as the gesture approaches a FULL turn,
 * where the centroid finally reaches the centre. Committing at a sixth of a turn
 * about a centroid sitting on the arc measures noise.
 *
 * ⭐ SO THIS ACCUMULATES THE SIGNED TURNING ANGLE OF THE PATH — the angle between
 * consecutive direction vectors. For a circular arc that **equals its central angle
 * exactly**, and it needs no centre estimate at all.
 *
 * ⭐ And the radius is the CIRCUMRADIUS OF THREE CONSECUTIVE SAMPLES — a local
 * curvature, which is the thing `rollRadiusMin` / `rollRadiusMax` are meaningful
 * against. It kills a false positive for free: a straight drag has zero curvature,
 * so an unbounded circumradius, so it sits above `rollRadiusMax` and accumulates
 * nothing. Under a centroid reading a straight path's bearing FLIPS BY 180° as it
 * passes the centroid — a large spurious accumulation, exactly where the measured
 * radius is smallest.
 *
 * ⛔ SIGN, DECLARED, BECAUSE A SIGN IS NOT TESTED BY TESTING THE MAGNITUDE:
 * screen coordinates run x right and **y DOWN**, so a positive cross product is a
 * turn from +x toward +y — which is **CLOCKWISE AS SEEN ON THE SCREEN**.
 *
 *     accumulatedDeg > 0  ⇒  CLOCKWISE on screen
 *     accumulatedDeg < 0  ⇒  COUNTER-CLOCKWISE on screen
 */
import { pxToMm } from "../core/units";
import type { GestureConfig } from "./gestureConfig";
import type { Sample } from "./motion";

/** Smaller than any real pointer step; guards the degenerate direction vectors. */
const EPSILON_PX = 1e-9;

export class RollDetector {
  /** The last two samples. Three points are the minimum for a curvature. */
  private a: Sample | null = null;
  private b: Sample | null = null;
  private accumDeg = 0;
  private committedFlag = false;

  constructor(private readonly cfg: GestureConfig) {}

  /** ⭐ Signed: positive is CLOCKWISE on screen. See the header. */
  get accumulatedDeg(): number {
    return this.accumDeg;
  }

  /** Latches. §1.3: once roll is committed the flick test is skipped. */
  get committed(): boolean {
    return this.committedFlag;
  }

  reset(): void {
    this.a = null;
    this.b = null;
    this.accumDeg = 0;
    this.committedFlag = false;
  }

  push(s: Sample): void {
    if (this.committedFlag) return; // latched; nothing can un-commit a roll
    const b = this.b;
    // ⛔ A REPEATED POSITION CARRIES NO DIRECTION, AND IS DROPPED WITHOUT ADVANCING
    // THE WINDOW. A golden vector caught the first version doing the opposite: it
    // shifted the pair first and rejected the triple afterwards, so one duplicated
    // sample blanked the next TWO triples as well. A pointer stream with a repeat
    // between every real sample -- which is what a stalled touch digitiser produces
    // -- then accumulated exactly nothing, and reported it as "no roll".
    if (b && Math.hypot(s.x - b.x, s.y - b.y) <= EPSILON_PX) return;
    const a = this.a;
    this.a = b;
    this.b = s;
    if (!a || !b) return;

    // ⭐ Both direction vectors are non-degenerate BY CONSTRUCTION: each sample was
    // checked against its predecessor above before it was ever stored. No second
    // guard here -- a check that cannot fire is not a check.
    const d1x = b.x - a.x;
    const d1y = b.y - a.y;
    const d2x = s.x - b.x;
    const d2y = s.y - b.y;
    const l1 = Math.hypot(d1x, d1y);
    const l2 = Math.hypot(d2x, d2y);

    const cross = d1x * d2y - d1y * d2x;
    const dot = d1x * d2x + d1y * d2y;

    // Circumradius of (a, b, s) = |ab|·|bs|·|as| / (4·area). Straight ⇒ area 0 ⇒ ∞.
    const chord = Math.hypot(s.x - a.x, s.y - a.y);
    const area2 = Math.abs(cross); // twice the triangle's area
    const radiusMm =
      area2 <= EPSILON_PX ? Infinity : pxToMm((l1 * l2 * chord) / (2 * area2));

    if (radiusMm < this.cfg.rollRadiusMin || radiusMm > this.cfg.rollRadiusMax) {
      // Out of the band: this stretch of path is not a roll, so nothing it swept
      // counts toward one. ⛔ Zero it — do not let a scribble and a straight run
      // add up to a circle between them.
      this.accumDeg = 0;
      return;
    }

    this.accumDeg += (Math.atan2(cross, dot) * 180) / Math.PI;
    if (Math.abs(this.accumDeg) >= this.cfg.rollAngle) this.committedFlag = true;
  }
}
