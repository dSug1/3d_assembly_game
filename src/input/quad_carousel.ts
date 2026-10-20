/**
 * ⭐⭐⭐ prototype (2026-10-19, the owner: *"now if I place the gizmo on the top face of part 42, the quads do not scroll and only one stays yellow highlighted
 * all the time. Propose another logic for the yellow highlight of the quads so that each quad is highlighted at least once in a 360 yaw orbit and the yellow
 * highlight switches from one quad to the other in a progressive way (for example, no switch from one quad to the opposite quad)."* → *"60 degrees might be
 * too long … Do the same, or at least one time yellow per 360degrees, whichever is more."* → *"build it anchored. face alignment menu."*) — **THE YELLOW QUAD
 * BY YAW**: the host's quads in a closed LOOP, each step to an angular neighbour (the shortest closed tour over their directions — never to the opposite
 * face where a neighbour exists), stepped by the camera's azimuth about the gizmo. ⭐ ANCHORED: a lap is a whole number of slices, a multiple of the quads —
 * every quad yellow the same number of times per lap, at the same yaws every lap — each slice at most `sliceMaxDeg` (today's ~40°: a switch every ~40° of
 * yaw on a box). The loop runs the way the camera turns and is set so the sideways quads sit nearest the yaw they face. ⛔ The quad facing the camera most
 * (`candidateFace`): on Piece42's top face one quad won all round (358° of 360°).
 * ⭐⭐⭐ (2026-10-20) the loop in the quads' own order (the frozen body's three planes, then the gizmo face's) — ⛔ the tour and its fitted phase.
 * ⛔ ENGINE-FREE.
 */
/** ⭐ A loop of the quads and how a lap of yaw is cut into it. */
export interface QuadCarousel {
  /** The quads' tags in loop order. */
  readonly order: readonly number[];
  /** Slices in one lap (a multiple of `order.length`). */
  readonly slices: number;
  /** Each slice (rad). */
  readonly sliceRad: number;
  /** The yaw (rad) where slice 0 starts. */
  readonly offsetRad: number;
}

/** ⭐ The hysteresis at a slice's edge (rad): the yellow kept while the camera stays this close to the edge it came across. */
export const QUAD_SLICE_HYSTERESIS_RAD = (3 * Math.PI) / 180;
const TWO_PI = 2 * Math.PI;

const wrap2pi = (a: number): number => a - TWO_PI * Math.floor(a / TWO_PI);

/** ⭐ The slices of an anchored lap: the fewest that keep each slice ≤ `sliceMaxDeg` and are a whole multiple of `n` quads. */
export function anchoredSlices(n: number, sliceMaxDeg: number): number {
  if (n <= 0) return 0;
  const need = Math.ceil(360 / Math.max(1e-6, sliceMaxDeg) - 1e-9);
  return n * Math.max(1, Math.ceil(need / n));
}

/**
 * ⭐⭐⭐ (2026-10-20, the owner: *"always put them in the same order (3 frozen object's orientations then gizmo face orientation). Same quad switch speed as
 * current."*) — the loop of `n` quads in THEIR OWN ORDER (0, 1, … n − 1, round again), anchored on the world's yaw (slice 0 starts at azimuth 0); the slices
 * as before (`anchoredSlices`: 4 quads at 40° at most → 12 of 30°, the switch every 30° as with 6). ⛔ (2026-10-19) the shortest tour over the directions and
 * its phase fitted to the sideways quads.
 */
export function fixedCarousel(n: number, sliceMaxDeg: number): QuadCarousel {
  const slices = anchoredSlices(n, sliceMaxDeg);
  return { order: Array.from({ length: Math.max(0, n) }, (_, i) => i), slices, sliceRad: slices > 0 ? TWO_PI / slices : TWO_PI, offsetRad: 0 };
}

/**
 * ⭐⭐ The yellow quad's tag at the camera's azimuth about the gizmo `yawRad` (rad, `atan2(z, x)` of the camera from the gizmo): its slice's quad — or `prev`
 * kept while the camera is within `QUAD_SLICE_HYSTERESIS_RAD` of the edge it came across (no flicker on an edge). `-1` with no quad.
 */
export function carouselQuad(c: QuadCarousel, yawRad: number, prev: number): number {
  if (c.order.length === 0 || c.slices === 0) return -1;
  const at = (a: number): number => c.order[Math.floor(wrap2pi(a - c.offsetRad) / c.sliceRad) % c.slices % c.order.length]!;
  const tag = at(yawRad);
  if (prev >= 0 && prev !== tag && (at(yawRad - QUAD_SLICE_HYSTERESIS_RAD) === prev || at(yawRad + QUAD_SLICE_HYSTERESIS_RAD) === prev)) return prev;
  return tag;
}
