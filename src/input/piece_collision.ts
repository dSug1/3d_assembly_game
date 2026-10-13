/**
 * ⭐⭐⭐ prototype — **THE ORBITED PIECE COLLIDES** (`COLLISION.md` §11; the owner, 2026-10-13: *"Now we need to work on the collision of the
 * green-turquoise piece with the other parts … reusing what we have done for the other parts (collision detection on next move, sliding,
 * etc) and adapting it for the piece specific orbit movement"* → the proposal agreed: *"I agree with all the rest of your recommendations.
 * Build"*).
 *
 * The rule is `core/collision.ts`'s (`resolveMove`: the path checked, contact allowed, only penetration refused — `D136`). What is the piece's
 * own is HOW its orbit step SLIDES: a world slide would push it off its ring.
 *
 * ⭐⭐ (2026-10-13, `COLLISION.md` §11bis; the owner: *"When the piece collides, sometimes (not always) there is some jitter as the input goes
 * into the direction of collision instead of smooth sliding … Do the root cause analysis and Propose"* → *"I agree with your recommendation …
 * Build"*) — the first build slid AXIS BY AXIS (the whole step, else the yaw alone, else the ring position alone): on a surface oblique to
 * those axes the piece crept along with the ring position frozen, then dropped ~10 mm at once — a stair-step, measured. ⭐ Now the step is
 * PROJECTED onto the contact surface in the orbit's own coordinates — COLLIDE AND SLIDE (Fauerby 2003, Nettle 2000), its "very close
 * distance" kept as a fixed rest gap (`backOff`) — through the Jacobian of the ring (`projectStep`: a least-squares step in the ring's metric
 * that never goes into a contact plane). ⛔ No engine, no scene.
 */
import type { Vec3 } from "../core/vec";

/** ⭐ The orbit's coordinates the piece rides: the yaw, the ring parameter, the zoom (the camera's — it never moves the piece). */
export interface OrbitParams {
  readonly yaw: number;
  readonly v: number;
  readonly zoom: number;
}

/** ⭐ A step (or a rate) in the orbit's two coordinates that move the piece: [yaw, ring parameter]. */
export type OrbitStep = readonly [number, number];

/** ⭐ A fraction `t` of the orbit step (the stop when the projected step is blocked too). */
export function lerpOrbit(from: OrbitParams, to: OrbitParams, t: number): OrbitParams {
  const k = Math.min(1, Math.max(0, t));
  return { yaw: from.yaw + (to.yaw - from.yaw) * k, v: from.v + (to.v - from.v) * k, zoom: to.zoom };
}

const dot3 = (a: Vec3, b: Vec3): number => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];

/**
 * ⭐⭐⭐ **THE SLIDE, IN THE ORBIT'S COORDINATES** — the step `dq` (yaw, ring parameter) with every component that would push the piece INTO a
 * contact removed. `J` is the ring's Jacobian at the piece (`J[0]` = how far the anchor moves per radian of yaw, `J[1]` per unit of ring
 * parameter, world metres); `normals` the contacts', unit, pointing toward the piece (`contactNormal`). For each contact the step is projected
 * onto the constraint `n · J dq ≥ 0` with the least change in the ring's own metric `JᵀJ` (so the piece moves along the surface as much as the
 * ring lets it — never a world slide off the ring); two active contacts leave no freedom in two coordinates — the step is ZERO.
 */
export function projectStep(dq: OrbitStep, J: readonly [Vec3, Vec3], normals: readonly Vec3[]): OrbitStep {
  const m11 = dot3(J[0], J[0]);
  const m12 = dot3(J[0], J[1]);
  const m22 = dot3(J[1], J[1]);
  const det = m11 * m22 - m12 * m12;
  if (!(det > 1e-18)) return dq; // a degenerate ring (no two directions): nothing to project in
  // M⁻¹ (2×2)
  const i11 = m22 / det;
  const i12 = -m12 / det;
  const i22 = m11 / det;
  const EPS = 1e-12;
  let s0 = dq[0];
  let s1 = dq[1];
  let active = 0;
  for (const n of normals) {
    const a0 = dot3(n, J[0]);
    const a1 = dot3(n, J[1]);
    const into = a0 * s0 + a1 * s1;
    if (!(into < -EPS)) continue;
    active++;
    const w0 = i11 * a0 + i12 * a1;
    const w1 = i12 * a0 + i22 * a1;
    const den = a0 * w0 + a1 * w1;
    if (!(den > 1e-18)) continue;
    const k = into / den;
    s0 -= k * w0;
    s1 -= k * w1;
  }
  // ⭐ every contact honoured, or none can be: two coordinates cannot satisfy two independent contacts while moving
  for (const n of normals) if (dot3(n, J[0]) * s0 + dot3(n, J[1]) * s1 < -1e-9) return [0, 0];
  void active;
  return [s0, s1];
}

/**
 * ⭐⭐ **THE REST GAP** — a stop `t` along a step `stepM` long, pulled back so the piece rests `gapM` short of where its path stopped (a fixed
 * small distance — Fauerby's "very close distance"): the next frame then starts APART, never at a bisection-dependent depth inside the skin.
 */
export function backOff(t: number, stepM: number, gapM: number): number {
  if (!(stepM > 0)) return 0;
  return Math.max(0, Math.min(1, t) - gapM / stepM);
}

/**
 * ⭐ The contact NORMALS kept from frame to frame while a contact lasts (the owner's agreed point 5): the new one added, a near-duplicate
 * (within ~8°) replacing its old self, at most `max` kept — so the slide does not flicker between two normals at an edge.
 */
export function rememberNormal(kept: readonly Vec3[], n: Vec3, max = 2): Vec3[] {
  const out = kept.filter((k) => dot3(k, n) < 0.99);
  out.unshift(n);
  return out.slice(0, max);
}
