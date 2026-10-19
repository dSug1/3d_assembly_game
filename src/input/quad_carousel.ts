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
 * ⛔ ENGINE-FREE.
 */
import type { Vec3 } from "../core/vec";

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
/** ⭐ A quad faces sideways enough to anchor the loop's phase when its horizontal part is at least this. */
const SIDEWAYS_MIN = 0.3;
const TWO_PI = 2 * Math.PI;

const unit = (a: Vec3): Vec3 => {
  const l = Math.hypot(a[0], a[1], a[2]) || 1;
  return [a[0] / l, a[1] / l, a[2] / l];
};
const angleBetween = (a: Vec3, b: Vec3): number => Math.acos(Math.max(-1, Math.min(1, a[0] * b[0] + a[1] * b[1] + a[2] * b[2])));
const wrap2pi = (a: number): number => a - TWO_PI * Math.floor(a / TWO_PI);
const wrapPi = (a: number): number => a - TWO_PI * Math.round(a / TWO_PI);

/** ⭐ The shortest closed tour over the directions (indices): every order for up to 8 (fixed start), else nearest neighbour then 2-opt. */
export function quadTour(normals: readonly Vec3[]): number[] {
  const n = normals.length;
  if (n <= 2) return normals.map((_, i) => i);
  const u = normals.map(unit);
  const d = u.map((a) => u.map((b) => angleBetween(a, b)));
  const length = (t: readonly number[]): number => t.reduce((s, x, i) => s + d[x]![t[(i + 1) % n]!]!, 0);
  if (n <= 8) {
    let best: number[] = [];
    let bestL = Infinity;
    const rest = Array.from({ length: n - 1 }, (_, i) => i + 1);
    const permute = (prefix: number[], left: number[]): void => {
      if (left.length === 0) {
        const t = [0, ...prefix];
        const l = length(t);
        if (l < bestL - 1e-12) {
          bestL = l;
          best = t;
        }
        return;
      }
      for (let i = 0; i < left.length; i++) permute([...prefix, left[i]!], [...left.slice(0, i), ...left.slice(i + 1)]);
    };
    permute([], rest);
    return best;
  }
  const t = [0];
  const used = new Set([0]);
  while (t.length < n) {
    const last = t[t.length - 1]!;
    let next = -1;
    for (let j = 0; j < n; j++) if (!used.has(j) && (next < 0 || d[last]![j]! < d[last]![next]!)) next = j;
    t.push(next);
    used.add(next);
  }
  for (let improved = true; improved; ) {
    improved = false;
    for (let i = 0; i < n - 1; i++)
      for (let k = i + 2; k < n; k++) {
        const a = t[i]!, b = t[i + 1]!, c = t[k]!, e = t[(k + 1) % n]!;
        if (a === e) continue;
        if (d[a]![c]! + d[b]![e]! < d[a]![b]! + d[c]![e]! - 1e-12) {
          t.splice(i + 1, k - i, ...t.slice(i + 1, k + 1).reverse());
          improved = true;
        }
      }
  }
  return t;
}

/** ⭐ The slices of an anchored lap: the fewest that keep each slice ≤ `sliceMaxDeg` and are a whole multiple of `n` quads. */
export function anchoredSlices(n: number, sliceMaxDeg: number): number {
  if (n <= 0) return 0;
  const need = Math.ceil(360 / Math.max(1e-6, sliceMaxDeg) - 1e-9);
  return n * Math.max(1, Math.ceil(need / n));
}

/**
 * ⭐⭐ The loop of the quads (`normals`, world) and its lap: the tour (`quadTour`), the way round and the starting quad chosen — and the phase set — so the
 * sideways quads' slices are centred as near as possible on the yaw they face (their horizontal heading), weighted by how sideways they are.
 */
export function quadCarousel(normals: readonly Vec3[], sliceMaxDeg: number): QuadCarousel {
  const n = normals.length;
  const slices = anchoredSlices(n, sliceMaxDeg);
  const sliceRad = slices > 0 ? TWO_PI / slices : TWO_PI;
  const tour = quadTour(normals);
  if (n === 0) return { order: [], slices: 0, sliceRad, offsetRad: 0 };
  let best: QuadCarousel | null = null;
  let bestCost = Infinity;
  for (const way of [tour, [tour[0]!, ...tour.slice(1).reverse()]]) {
    for (let start = 0; start < n; start++) {
      const order = [...way.slice(start), ...way.slice(0, start)];
      // the phase: the weighted circular mean of (heading − its first slice's centre) over the sideways quads
      let sx = 0, sy = 0;
      const marks: { h: number; c: number; w: number }[] = [];
      order.forEach((tag, j) => {
        const v = normals[tag]!;
        const hz = Math.hypot(v[0], v[2]);
        if (hz < SIDEWAYS_MIN) return;
        const h = Math.atan2(v[2], v[0]);
        const c = (j + 0.5) * sliceRad;
        marks.push({ h, c, w: hz });
        sx += hz * Math.cos(h - c);
        sy += hz * Math.sin(h - c);
      });
      const offsetRad = marks.length > 0 ? Math.atan2(sy, sx) : 0;
      // the cost: each sideways quad against the NEAREST of its slices (it recurs every n slices)
      let cost = 0;
      for (const m of marks) {
        let near = Infinity;
        for (let r = 0; r < slices / n; r++) near = Math.min(near, Math.abs(wrapPi(m.h - (offsetRad + m.c + r * n * sliceRad))));
        cost += m.w * near * near;
      }
      if (cost < bestCost - 1e-12) {
        bestCost = cost;
        best = { order, slices, sliceRad, offsetRad };
      }
    }
  }
  return best!;
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
