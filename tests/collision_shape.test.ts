/**
 * ⭐⭐⭐ **THE SURFACE GAP — vectors for `D49`'s convex shape and its GJK distance.**
 *
 * ⛔⛔ **EVERY FIXTURE HERE IS CHOSEN WHERE THE ANSWER IS LARGE AND SIGNED**, which is the
 * 2026-09-17 audit's verdict on this project's most repeated mistake: *a fixture picked because
 * it is easy to reason about is usually picked from the set where the quantity under test is
 * zero.* ⚠ So no identity orientations where two compositions coincide, no gap of exactly one
 * unit where a factor of two is invisible, and the closest feature is a **vertex**, an **edge**
 * and a **face** in three separate vectors — because a face-to-face fixture alone would certify
 * a GJK that never reduces its simplex past a triangle.
 *
 * ⭐ Each block names the mutation it kills. A vector that no edit can redden is not a vector.
 */
import { describe, expect, it } from "vitest";
import type { Vec3 } from "../src/core/vec";
import { add, dot } from "../src/core/vec";
import {
  boxShape,
  gapBetween,
  reducePoints,
  shapeFromVertices,
  nearestOnSimplex,
  supportPoint,
} from "../src/core/collision_shape";

/** A `2 × 2 × 2` box centred at `c` — corners at `c ± 1`, so every half-extent is 1. */
function unitBoxAt(c: Vec3): Vec3[] {
  return boxShape([2, 2, 2]).points.map((p) => add(p, c));
}

/** Deterministic, near-uniform directions on the sphere — the sampled references' input. */
function fibonacciDirections(n: number): Vec3[] {
  const out: Vec3[] = [];
  const ga = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < n; i++) {
    const z = 1 - (2 * i + 1) / n;
    const r = Math.sqrt(Math.max(0, 1 - z * z));
    out.push([r * Math.cos(ga * i), r * Math.sin(ga * i), z]);
  }
  return out;
}

/** max over sampled directions of the support-plane separation — a LOWER bound on the truth. */
function referenceGapWith(
  a: readonly Vec3[],
  b: readonly Vec3[],
  dirs: readonly Vec3[],
): number {
  let best = 0;
  for (const d of dirs) {
    let lo = Infinity;
    for (const p of a) {
      for (const q of b) lo = Math.min(lo, dot([p[0] - q[0], p[1] - q[1], p[2] - q[2]], d));
    }
    if (lo > best) best = lo;
  }
  return best;
}

const SQRT2 = Math.SQRT2;
const SQRT3 = Math.sqrt(3);

describe("⭐ boxShape — the eight corners, and all three extents distinct", () => {
  // ⛔ `L × 2L × 3L`, never a cube: a cube cannot tell `dims[0]/2` from `dims[1]/2`, so a
  // transposed axis would pass. This is the shape the scene actually uses.
  const s = boxShape([2, 4, 6]);

  it("has eight distinct corners", () => {
    expect(s.points).toHaveLength(8);
    expect(new Set(s.points.map((p) => p.join(","))).size).toBe(8);
  });

  it("puts every corner at the HALF extents — kills a missing ÷2, and a transposed axis", () => {
    for (const p of s.points) {
      expect(Math.abs(p[0])).toBeCloseTo(1, 12);
      expect(Math.abs(p[1])).toBeCloseTo(2, 12);
      expect(Math.abs(p[2])).toBeCloseTo(3, 12);
    }
  });

  it("is centred on the local origin — the eight corners sum to zero", () => {
    const sum = s.points.reduce((a, p) => add(a, p), [0, 0, 0] as Vec3);
    for (const c of sum) expect(c).toBeCloseTo(0, 12);
  });
});

describe("⭐ supportPoint — the furthest vertex, and it never reads a normal", () => {
  const s = boxShape([2, 4, 6]);

  it("returns the extreme corner for a diagonal direction", () => {
    expect(supportPoint(s.points, [1, 1, 1])).toEqual([1, 2, 3]);
    expect(supportPoint(s.points, [-1, 1, -1])).toEqual([-1, 2, -3]);
  });

  it("⭐⭐ resolves a REAL TIE to the FIRST point, in either input order", () => {
    // ⛔⛔ THE FIRST VERSION OF THIS VECTOR ASKED FOR `[1,1,1]`, WHICH HAS A UNIQUE ANSWER —
    // so it contained no tie at all and a `>=` argmax passed it. ⚠ Mistake shape 5, caught by
    // running the mutant: *a fixture picked because it is easy is usually picked from the set
    // where the quantity under test is absent.* ⭐ `+x` on a box ties FOUR corners.
    const ties = s.points.filter((p) => p[0] === 1);
    expect(ties).toHaveLength(4);
    expect(supportPoint(s.points, [1, 0, 0])).toEqual(s.points.find((p) => p[0] === 1));
    const reversed = [...s.points].reverse();
    expect(supportPoint(reversed, [1, 0, 0])).toEqual(reversed.find((p) => p[0] === 1));
  });

  it("⭐⭐ scaling the direction cannot change the answer", () => {
    expect(supportPoint(s.points, [0.001, 0.001, 0.001])).toEqual([1, 2, 3]);
  });
});

describe("⭐⭐⭐ gapBetween — the distance between two convex point sets", () => {
  it("⭐ FACE to FACE: two unit boxes 5 apart on x have a gap of 3", () => {
    // ⚠ Hand-computed and NOT derived by calling the product: A spans x ∈ [−1, 1], B spans
    // x ∈ [4, 6], so the gap is 4 − 1 = 3. ⛔ 5 apart with a gap of 3 — the separation and the
    // answer are different numbers, so a function returning the centre distance fails here.
    expect(gapBetween(unitBoxAt([0, 0, 0]), unitBoxAt([5, 0, 0]))!).toBeCloseTo(3, 9);
  });

  it("⭐⭐ VERTEX to VERTEX: the closest feature is a corner pair, and the gap is 2√3", () => {
    // Corner [1,1,1] against corner [3,3,3] ⇒ |[2,2,2]| = 2√3 ≈ 3.4641.
    // ⛔⛔ THE VECTOR THAT MATTERS MOST. A GJK that stops reducing its simplex reports the
    // distance to a FACE plane here (2 × 3 − ... ) and not to the corner, and a face-to-face
    // fixture alone could never see it.
    expect(gapBetween(unitBoxAt([0, 0, 0]), unitBoxAt([4, 4, 4]))!).toBeCloseTo(2 * SQRT3, 9);
  });

  it("⭐⭐ EDGE to EDGE: two parallel edges 2√2 apart", () => {
    // A's edge at x=1, y=1, z ∈ [−1,1] against B's at x=3, y=3 ⇒ |[2,2,0]| = 2√2 ≈ 2.8284.
    expect(gapBetween(unitBoxAt([0, 0, 0]), unitBoxAt([4, 4, 0]))!).toBeCloseTo(2 * SQRT2, 9);
  });

  it("⭐ a ROTATED box — 45° about z, so its x half-extent is √2 and the gap is 4 − √2", () => {
    // ⛔ Built by hand, not by calling a rotation helper: (x,y) → ((x−y)/√2, (x+y)/√2) sends the
    // four corners (±1,±1) to (0,±√2) and (±√2,0). Translated to x=5, its nearest point is
    // (5−√2, 0, ±1), which lies within A's face span, so the gap is (5−√2) − 1.
    const rotated: Vec3[] = [];
    for (const [x, y] of [
      [0, SQRT2],
      [-SQRT2, 0],
      [0, -SQRT2],
      [SQRT2, 0],
    ] as const) {
      for (const z of [-1, 1]) rotated.push([x + 5, y, z]);
    }
    expect(gapBetween(unitBoxAt([0, 0, 0]), rotated)!).toBeCloseTo(4 - SQRT2, 9);
  });

  it("⛔ TOUCHING exactly is zero — the boundary value, compared AT the boundary", () => {
    expect(gapBetween(unitBoxAt([0, 0, 0]), unitBoxAt([2, 0, 0]))!).toBeCloseTo(0, 9);
  });

  it("⛔ OVERLAPPING is zero, not negative and not NaN", () => {
    const g = gapBetween(unitBoxAt([0, 0, 0]), unitBoxAt([1, 0, 0]));
    expect(g).toBe(0);
  });

  it("⛔ COINCIDENT bodies are zero — the origin is strictly inside the difference set", () => {
    expect(gapBetween(unitBoxAt([0, 0, 0]), unitBoxAt([0, 0, 0]))).toBe(0);
  });

  it("⭐⭐ is SYMMETRIC — kills a support function that took `dir` for both bodies", () => {
    const a = unitBoxAt([0, 0, 0]);
    const b = unitBoxAt([4, 4, 4]);
    expect(gapBetween(a, b)!).toBeCloseTo(gapBetween(b, a)!, 9);
  });

  it("⭐ a box against a single POINT — a degenerate cloud is still a convex set", () => {
    // ⚠ One point is a legitimate shape, and it exercises a simplex that can never reach 4.
    expect(gapBetween(unitBoxAt([0, 0, 0]), [[7, 0, 0]])!).toBeCloseTo(6, 9);
  });

  it("⭐⭐ two COPLANAR faces sliding past each other — the flat-tetrahedron path", () => {
    // ⛔⛔ THE CASE THE VOLUME TEST EXISTS FOR. A spans x ∈ [−1,1], B spans x ∈ [4,6] with the
    // SAME y and z extents, so four support points of the difference set are coplanar and the
    // tetrahedron is flat. ⚠ Without the degeneracy check that reads as CONTAINMENT and the
    // answer collapses to 0 — a pair that would capture from any distance.
    for (const yOffset of [0, 0.5, 1.5]) {
      const g = gapBetween(unitBoxAt([0, 0, 0]), unitBoxAt([5, yOffset, 0]))!;
      const expected = yOffset <= 2 ? Math.hypot(3, Math.max(0, yOffset - 2)) : 0;
      expect(g).toBeCloseTo(expected, 9);
    }
  });

  it("⛔ an EMPTY shape returns null, never 0 and never Infinity", () => {
    // `LESSONS_CARRIED` §6 — and here BOTH defaults are harmful: 0 captures everything,
    // Infinity captures nothing, and each looks like a working rule on the glass.
    expect(gapBetween([], unitBoxAt([0, 0, 0]))).toBeNull();
    expect(gapBetween(unitBoxAt([0, 0, 0]), [])).toBeNull();
  });

  it("⭐ scales with the geometry — the same pair at 1/1000 the size gives 1/1000 the gap", () => {
    // ⛔ The relative termination test is what this pins. An ABSOLUTE epsilon would stop early
    // at metre scale or never at millimetre scale, and this project works in metres where an
    // interesting gap is 0.001.
    const small = (c: Vec3): Vec3[] => boxShape([0.002, 0.002, 0.002]).points.map((p) => add(p, c));
    expect(gapBetween(small([0, 0, 0]), small([0.005, 0, 0]))!).toBeCloseTo(0.003, 12);
  });
});

/**
 * ⛔⛔⛔ **EVERY FIXTURE ABOVE IS A BOX, AND A BOX IS THE ONE SHAPE THAT HIDES THIS ALGORITHM.**
 *
 * ⚠⚠ Measured, by running the mutants rather than by reasoning: with the flat-tetrahedron
 * guard deleted, with the simplex reduction deleted, and with the termination test made
 * absolute, **all 24 box vectors stayed green.** ⭐ The cause is that the Minkowski difference
 * of two boxes is itself a box, so GJK lands on the answer in one or two steps and never builds
 * a tetrahedron, never reduces a simplex, and terminates EXACTLY — every deep path in the file
 * was unreached by the whole suite.
 *
 * ⭐⭐⭐ `METHOD`, and it is mistake shape 3 with my name on it: *a green suite over the shape
 * the product happens to use today is not coverage of the algorithm underneath it.* ⛔ The
 * bodies are boxes now and `3D4` imports arbitrary meshes — the day the algorithm first matters
 * is the day nothing here would have been watching it.
 */
describe("⭐⭐⭐ NON-BOX bodies — the paths a box can never reach", () => {
  /** A regular tetrahedron inscribed in the cube: four vertices, four triangular faces. */
  const TETRA: Vec3[] = [
    [1, 1, 1],
    [1, -1, -1],
    [-1, 1, -1],
    [-1, -1, 1],
  ];

  it("⭐⭐ CONTAINMENT: a point strictly inside the tetrahedron gives 0", () => {
    // ⛔ This is the only fixture in the file that reaches `nearestOnTetrahedron`'s *inside*
    // branch — the origin ends up enclosed by a 4-point simplex.
    expect(gapBetween(TETRA, [[0, 0, 0]])).toBe(0);
  });

  it("⭐⭐ EDGE of a non-box: the +x extreme feature is an edge, and the gap is exactly 9", () => {
    // ⚠ Hand-computed: the two vertices at x = 1 span the edge (1, s, s), s ∈ [−1, 1]. The
    // nearest point on it to (10,0,0) is its midpoint (1,0,0), so the gap is 10 − 1 = 9.
    expect(gapBetween(TETRA, [[10, 0, 0]])!).toBeCloseTo(9, 9);
  });

  it("⭐⭐ FACE INTERIOR: a point on the outward normal through a face centroid", () => {
    // ⚠ The face {(1,−1,−1), (−1,1,−1), (−1,−1,1)} lies in the plane x+y+z = −1, whose outward
    // normal is −(1,1,1)/√3 and whose centroid is (−⅓,−⅓,−⅓). A point 5 along that normal has
    // all three coordinates equal to (−1 − 5√3)/3, and its projection onto the plane IS the
    // centroid — so the closest feature is the face's INTERIOR, not a vertex or an edge.
    const a = (-1 - 5 * SQRT3) / 3;
    expect(gapBetween(TETRA, [[a, a, a]])!).toBeCloseTo(5, 9);
  });

  it("⭐ two tetrahedra, tip to tip along x", () => {
    // ⚠ The mirrored tetra's −x extreme is the edge (−1, s, s); translated to x = 7 it sits at
    // x = 6, against this one's edge at x = 1 ⇒ a gap of 5, edge to edge.
    const mirrored: Vec3[] = TETRA.map((p) => [-p[0] + 7, p[1], p[2]]);
    expect(gapBetween(TETRA, mirrored)!).toBeCloseTo(5, 9);
  });
});

/**
 * ⭐⭐⭐ **A DIFFERENTIAL CHECK AGAINST AN INDEPENDENT REFERENCE** — random convex clouds, at
 * three scales spanning a factor of a million.
 *
 * ⛔⛔ **THE REFERENCE SHARES NO CODE WITH THE PRODUCT**, which is the whole point: the audit
 * found `worldPose` vectored by *calling `worldPose`*, and a reference built from
 * `nearestOnSimplex` would be the same mistake. ⭐ This one uses duality instead — for a convex
 * set `H` not containing the origin, `distance(0, H) = max over unit d of min over p∈H of d·p`
 * — evaluated over a Fibonacci sphere. ⚠ Sampling makes it a strict LOWER bound, so the
 * assertion is two-sided: the product must be at least the reference and at most the nearest
 * vertex pair, which is an upper bound by construction.
 */
describe("⭐⭐⭐ gapBetween against an independent reference — random clouds, three scales", () => {
  const DIRS = fibonacciDirections(6000);
  const referenceGap = (a: readonly Vec3[], b: readonly Vec3[]): number =>
    referenceGapWith(a, b, DIRS);

  /** A deterministic cloud. ⛔ `flat` pins z, which is what reaches the flat-tetrahedron path. */
  function cloud(seed: number, n: number, radius: number, centre: Vec3, flat = false): Vec3[] {
    let s = seed >>> 0;
    const rnd = (): number => {
      s = (s * 1103515245 + 12345) & 0x7fffffff;
      return s / 0x7fffffff;
    };
    const out: Vec3[] = [];
    for (let i = 0; i < n; i++) {
      const u = rnd() * 2 - 1;
      const t = rnd() * Math.PI * 2;
      const r = radius * Math.cbrt(rnd());
      const k = Math.sqrt(1 - u * u);
      out.push([
        centre[0] + r * k * Math.cos(t),
        centre[1] + r * k * Math.sin(t),
        flat ? centre[2] : centre[2] + r * u,
      ]);
    }
    return out;
  }

  /** The nearest vertex PAIR — an upper bound on the true distance, by construction. */
  function nearestVertexPair(a: readonly Vec3[], b: readonly Vec3[]): number {
    let upper = Infinity;
    for (const p of a) {
      for (const q of b) upper = Math.min(upper, Math.hypot(p[0] - q[0], p[1] - q[1], p[2] - q[2]));
    }
    return upper;
  }

  // ⛔⛔ THESE CONFIGURATIONS WERE *MEASURED*, NOT CHOSEN. An instrumented sweep over 4000
  // random pairs reported which ones reach which branch, because the first version of this file
  // guessed and got it wrong: with boxes only, GJK converged in ONE step and three deep paths
  // were unreached by all 24 vectors. ⭐ `METHOD`: *ask the code which branch it took; do not
  // infer it from the fixture you meant to write.*
  //
  // ⚠ `flat` is the one that matters most: two COPLANAR bodies make every 4-point simplex
  // degenerate, which is the only way to reach the zero-volume guard.
  const CONFIGS: readonly {
    name: string;
    n: number;
    sep: number;
    flat: boolean;
    seed: number;
  }[] = [
    { name: "3D, well separated", n: 14, sep: 3.2, flat: false, seed: 7 },
    { name: "3D, many vertices, close", n: 21, sep: 2.05, flat: false, seed: 2857 },
    { name: "3D, nearly touching", n: 18, sep: 2.02, flat: false, seed: 4242 },
    { name: "⭐ COPLANAR, close", n: 15, sep: 2.26, flat: true, seed: 3 },
    { name: "⭐ COPLANAR, many vertices", n: 22, sep: 2.6, flat: true, seed: 90909 },
  ];

  // ⛔ THREE SCALES. A single scale cannot tell a RELATIVE convergence test from an ABSOLUTE
  // one, and metres is a unit where an interesting gap is 0.001 — so a threshold that works at
  // scene scale and fails at part scale would be invisible on one fixture.
  for (const scale of [0.001, 1, 1000]) {
    for (const c of CONFIGS) {
      it(`${c.name} matches the reference at scale ${scale}`, () => {
        const a = cloud(c.seed, c.n, scale, [0, 0, 0], c.flat);
        const b = cloud(c.seed * 3 + 1, c.n, scale, [c.sep * scale, 0.4 * scale, 0], c.flat);
        const got = gapBetween(a, b)!;
        const lower = referenceGap(a, b);
        const upper = nearestVertexPair(a, b);
        // ⛔ The pair must genuinely be APART, or every assertion below is satisfied by 0 and
        // the vector certifies nothing — which is how a whole suite can stay green.
        expect(lower).toBeGreaterThan(0.05 * scale);
        expect(got).toBeGreaterThanOrEqual(lower - 1e-9 * scale);
        expect(got).toBeLessThanOrEqual(upper + 1e-9 * scale);
        // ⚠⚠ **THIS BOUND IS DELIBERATELY LOOSE, AND THE SHARP TEST IS THE NEXT BLOCK.** A
        // uniform sphere sample converges as O(θ) here — the minimising vertex CHANGES as the
        // direction turns — so no affordable direction count pins the last digits. ⛔ Measured
        // at 6k/60k/400k: 0.76074 / 0.76318 / 0.76516 against the product's 0.76555, converging
        // upward onto it. ⭐ So this block's job is scale coverage and gross errors (a wrong 0
        // fails outright); `exactHullDistance` below does the pinning.
        expect(Math.abs(got - lower)).toBeLessThan(0.05 * lower);
      });
    }
  }

  it("⭐⭐ THE REFERENCE CONVERGES UPWARD ONTO THE PRODUCT — the direction, asserted", () => {
    // ⛔⛔ THE TOLERANCE ABOVE IS SLACK, AND SLACK HIDES A SMALL CONSTANT ERROR. This vector
    // closes that: refining the direction set must move the lower bound TOWARDS the product's
    // answer and never past it. ⭐ A product that is systematically 1% high would keep the 2%
    // tolerance green for ever and fail here, because the reference would converge to a
    // different number than the one being asserted against.
    const a = cloud(2857, 21, 1, [0, 0, 0]);
    const b = cloud(2857 * 3 + 1, 21, 1, [2.05, 0.4, 0]);
    const got = gapBetween(a, b)!;
    const coarse = referenceGapWith(a, b, fibonacciDirections(1500));
    const fine = referenceGapWith(a, b, fibonacciDirections(24000));
    expect(coarse).toBeLessThan(fine);
    expect(fine).toBeLessThanOrEqual(got + 1e-12);
    // ⚠ And it must close most of the remaining distance, or "converging" is just a word.
    expect(got - fine).toBeLessThan(0.4 * (got - coarse));
  });

  it("⭐⭐⭐ A BROAD SWEEP — 600 random pairs, bracketed by two independent bounds", () => {
    // ⛔ The tight reference is too slow to run hundreds of times, and a handful of cases cannot
    // cover a branch structure. ⭐ So this sweep uses a CHEAP lower bound (64 directions) and
    // the vertex-pair upper bound — loose, but enough to catch the failure mode that matters:
    // a degenerate simplex reported as CONTAINMENT, which returns 0 and would capture a pair
    // from any distance at all.
    const cheap = fibonacciDirections(64);
    let checked = 0;
    for (let trial = 0; trial < 600; trial++) {
      const flat = trial % 3 === 0;
      const n = 4 + (trial % 20);
      const sep = 0.2 + ((trial * 37) % 40) / 10;
      const a = cloud(trial * 7919 + 13, n, 1, [0, 0, 0], flat);
      const b = cloud(trial * 104729 + 7, n, 1, [sep, ((trial % 7) - 3) / 4, 0], flat);
      const got = gapBetween(a, b)!;
      let lower = 0;
      for (const d of cheap) {
        let lo = Infinity;
        for (const p of a) {
          for (const q of b) lo = Math.min(lo, dot([p[0] - q[0], p[1] - q[1], p[2] - q[2]], d));
        }
        if (lo > lower) lower = lo;
      }
      expect(got).toBeGreaterThanOrEqual(lower - 1e-9);
      expect(got).toBeLessThanOrEqual(nearestVertexPair(a, b) + 1e-9);
      // ⭐ SYMMETRY and TRANSLATION INVARIANCE, free on every one of the 600.
      expect(gapBetween(b, a)!).toBeCloseTo(got, 9);
      const shift: Vec3 = [11.5, -4.25, 6.75];
      const moved = gapBetween(a.map((p) => add(p, shift)), b.map((p) => add(p, shift)))!;
      expect(moved).toBeCloseTo(got, 8);
      if (lower > 0.05) checked++;
    }
    // ⚠ Assert the sweep actually exercised separated pairs; a sweep of overlaps proves nothing.
    expect(checked).toBeGreaterThan(200);
  });

  it("⭐⭐ OVERLAPPING random clouds are exactly 0, at every scale", () => {
    for (const scale of [0.001, 1, 1000]) {
      const a = cloud(11, 14, scale, [0, 0, 0]);
      const b = cloud(22, 14, scale, [0.3 * scale, 0, 0]);
      expect(gapBetween(a, b)).toBe(0);
    }
  });
});

describe("⭐⭐ reducePoints — an INNER approximation, so a pair captures late and never early", () => {
  /** A deterministic ball of points, dense enough to need reducing. */
  const ball = (): Vec3[] => {
    const out: Vec3[] = [];
    let seed = 12345;
    const rnd = (): number => {
      seed = (seed * 1103515245 + 12345) & 0x7fffffff;
      return seed / 0x7fffffff;
    };
    for (let i = 0; i < 400; i++) {
      const u = rnd() * 2 - 1;
      const t = rnd() * Math.PI * 2;
      const r = Math.cbrt(rnd());
      const s = Math.sqrt(1 - u * u);
      out.push([r * s * Math.cos(t), r * s * Math.sin(t), r * u]);
    }
    return out;
  };

  it("leaves a cloud that already fits completely untouched — a box is never reduced", () => {
    const s = boxShape([2, 4, 6]);
    expect(reducePoints(s.points, 64)).toBe(s.points);
  });

  it("⛔ keeps only REAL vertices, and at most 26 of them", () => {
    const full = ball();
    const kept = reducePoints(full, 64);
    expect(kept.length).toBeLessThanOrEqual(26);
    for (const p of kept) expect(full).toContainEqual(p);
  });

  it("⭐⭐⭐ NEVER REPORTS A SMALLER GAP THAN THE TRUE HULL — the safe direction, measured", () => {
    // ⛔ This is the property the whole approximation rests on, and it is asserted rather than
    // argued: a reduced hull is CONTAINED in the true one, so the gap it reports is never
    // smaller. ⚠ A reduction that kept an interior point instead of an extreme one would break
    // it, and nothing else here would notice.
    const full = ball();
    const kept = reducePoints(full, 64);
    const other = unitBoxAt([4, 0, 0]);
    const gapFull = gapBetween(full, other)!;
    const gapKept = gapBetween(kept, other)!;
    expect(gapKept).toBeGreaterThanOrEqual(gapFull - 1e-12);
    // ⭐ And it must not be uselessly loose: 26 directions on a ball is a good approximation.
    expect(gapKept - gapFull).toBeLessThan(0.05);
  });
});

describe("⭐ shapeFromVertices — the flat array an engine hands across the boundary", () => {
  it("reads xyz triples in order", () => {
    const s = shapeFromVertices([1, 2, 3, -4, -5, -6]);
    expect(s.points).toEqual([
      [1, 2, 3],
      [-4, -5, -6],
    ]);
  });

  it("⛔ drops a NaN vertex rather than poisoning every later comparison", () => {
    // ⚠ One NaN in a cloud makes every `>` and `<=` against the gap false, so the body simply
    // stops capturing — with nothing on the glass to say why.
    const s = shapeFromVertices([1, 2, 3, NaN, 0, 0, 4, 5, 6]);
    expect(s.points).toHaveLength(2);
  });

  it("⛔ a truncated triple is ignored, and an empty array gives an empty shape", () => {
    expect(shapeFromVertices([1, 2, 3, 9, 9]).points).toHaveLength(1);
    expect(shapeFromVertices([]).points).toHaveLength(0);
    // ⭐ And an empty shape is refused by `gapBetween` rather than answering — the two halves
    // of this decision are in different files, so the composition is asserted here.
    expect(gapBetween(shapeFromVertices([]).points, unitBoxAt([0, 0, 0]))).toBeNull();
  });
});

/**
 * ⭐⭐⭐ **AN *EXACT* REFERENCE, BY A DIFFERENT METHOD — and this is the block that pins the
 * product's last digits.**
 *
 * ⛔⛔ **THE TWO SAMPLED REFERENCES ABOVE ARE LOWER BOUNDS, AND A BOUND CANNOT CATCH A SMALL
 * SYSTEMATIC ERROR.** Measured: a dropped clamp inside the segment routine moves the answer by
 * **0.06 %**, and no affordable uniform direction count resolves that — the bound converges as
 * O(θ) because the minimising vertex changes as the direction turns. ⚠ A local refinement was
 * tried and rejected: the maximum sits on a KINK, where a cone search stalls (it got to 5e-4
 * relative and no further). ⭐ Recorded because both are reasonable ideas that do not work.
 *
 * ⭐⭐ **WHAT DOES WORK IS CARATHÉODORY.** The closest point of a hull to the origin is carried
 * by a subset of at most 4 of its points, so enumerating every subset and solving each one
 * EXACTLY gives the true distance — no iteration, no tolerance, no convergence. ⛔ It is
 * exponential, which is why the clouds here are small; five points a side is still enough to
 * build tetrahedra and degeneracies.
 *
 * ⭐⭐⭐ **AND IT SHARES NO CODE WITH THE PRODUCT, WHICH IS THE ENTIRE POINT.** GJK decides a
 * simplex by Voronoi-REGION tests; this solves the equality-constrained least squares by
 * Lagrange multipliers and a linear solve, then checks the barycentric weights for sign. Two
 * formulations of one quantity. ⚠ The audit found `worldPose` vectored by calling `worldPose`;
 * a reference built on `nearestOnSimplex` would be that mistake in this file.
 */
describe("⭐⭐⭐ gapBetween against an EXACT reference — Carathéodory over small clouds", () => {
  /** Solve `A x = b` by Gaussian elimination with partial pivoting. `null` if singular. */
  function solve(A: number[][], b: number[]): number[] | null {
    const n = b.length;
    // ⚠ Plain indexed access throughout; the compiler's unchecked-index rule is satisfied by a
    // local getter rather than by non-null assertions, so a genuine out-of-range read would
    // surface as a 0 in the result instead of a crash inside the reference.
    const M: number[][] = A.map((row, i) => [...row, b[i] ?? 0]);
    const g = (r: number, c: number): number => M[r]?.[c] ?? 0;
    const set = (r: number, c: number, v: number): void => {
      const row = M[r];
      if (row) row[c] = v;
    };
    for (let col = 0; col < n; col++) {
      let piv = col;
      for (let r = col + 1; r < n; r++) if (Math.abs(g(r, col)) > Math.abs(g(piv, col))) piv = r;
      if (Math.abs(g(piv, col)) < 1e-14) return null;
      const tmp = M[col] as number[];
      M[col] = M[piv] as number[];
      M[piv] = tmp;
      for (let r = 0; r < n; r++) {
        if (r === col) continue;
        const f = g(r, col) / g(col, col);
        for (let c = col; c <= n; c++) set(r, c, g(r, c) - f * g(col, c));
      }
    }
    const out: number[] = [];
    for (let i = 0; i < n; i++) out.push(g(i, n) / g(i, i));
    return out;
  }

  /** The exact distance from the origin to the convex hull of `pts`. */
  function exactHullDistance(pts: readonly Vec3[]): number {
    let best = Infinity;
    const n = pts.length;
    const consider = (idx: readonly number[]): void => {
      const k = idx.length;
      // minimise |Σ λ p|² subject to Σ λ = 1 ⇒ [2G 1; 1ᵀ 0][λ; μ] = [0; 1]
      const P = (i: number): Vec3 => pts[idx[i] ?? 0] ?? [0, 0, 0];
      const A: number[][] = [];
      for (let i = 0; i < k; i++) {
        const row: number[] = [];
        for (let j = 0; j < k; j++) row.push(2 * dot(P(i), P(j)));
        row.push(1);
        A.push(row);
      }
      A.push([...new Array(k).fill(1), 0]);
      const sol = solve(A, [...new Array(k).fill(0), 1]);
      if (sol === null) return;
      const lam = sol.slice(0, k);
      // ⚠ A subset whose solution has a NEGATIVE weight is not the supporting face; a smaller
      // subset carries the answer, and this enumeration reaches every smaller subset too.
      if (lam.some((l) => l < -1e-12)) return;
      let x: Vec3 = [0, 0, 0];
      for (let i = 0; i < k; i++) {
        const p = P(i);
        const l = lam[i] ?? 0;
        x = add(x, [p[0] * l, p[1] * l, p[2] * l]);
      }
      best = Math.min(best, Math.hypot(x[0], x[1], x[2]));
    };
    // ⛔⛔ SUBSETS OF SIZE ≤ 4 — Carathéodory's bound in three dimensions. ⚠ The first version
    // looped over all 2ⁿ bit masks, which is 33 million for a 25-point difference set and hung
    // the suite. Enumerating by SIZE is 15 275 of them.
    for (let i = 0; i < n; i++) {
      consider([i]);
      for (let j = i + 1; j < n; j++) {
        consider([i, j]);
        for (let k = j + 1; k < n; k++) {
          consider([i, j, k]);
          for (let l = k + 1; l < n; l++) consider([i, j, k, l]);
        }
      }
    }
    return best;
  }

  function differenceSet(a: readonly Vec3[], b: readonly Vec3[]): Vec3[] {
    const out: Vec3[] = [];
    for (const p of a) for (const q of b) out.push([p[0] - q[0], p[1] - q[1], p[2] - q[2]]);
    return out;
  }

  // ⛔⛔ THE FOUR SHAPES ARE NOT DECORATION. A fully 3D cloud never reaches the zero-volume
  // guard; an exactly COPLANAR pair reaches it and agrees anyway; a NEARLY coplanar pair is
  // where the guard changes the answer — measured over 8000 configurations, where deleting it
  // turned a real gap into **0**, which on the glass is a pair that captures from any distance.
  const SHAPES = ["3D", "coplanar", "near-coplanar", "collinear"] as const;

  function cloud(seed: number, n: number, centre: Vec3, shape: (typeof SHAPES)[number]): Vec3[] {
    let s = seed >>> 0;
    const rnd = (): number => {
      s = (s * 1103515245 + 12345) & 0x7fffffff;
      return s / 0x7fffffff;
    };
    const out: Vec3[] = [];
    for (let i = 0; i < n; i++) {
      const x = centre[0] + rnd() * 2 - 1;
      const y = centre[1] + rnd() * 2 - 1;
      const z = centre[2] + rnd() * 2 - 1;
      out.push(
        shape === "3D" ? [x, y, z]
          : shape === "coplanar" ? [x, y, 0]
          : shape === "near-coplanar" ? [x, y, z * 1e-6]
          : [x, 0, 0],
      );
    }
    return out;
  }

  for (const shape of SHAPES) {
    it(`matches the exact hull distance over 40 ${shape} pairs`, () => {
      let separated = 0;
      let overlapping = 0;
      for (let trial = 0; trial < 40; trial++) {
        const sep = 0.15 + (trial % 14) * 0.25;
        const a = cloud(trial * 7919 + 13, 5, [0, 0, 0], shape);
        const b = cloud(trial * 104729 + 7, 5, [sep, ((trial % 5) - 2) / 3, 0], shape);
        const got = gapBetween(a, b)!;
        const exact = exactHullDistance(differenceSet(a, b));
        // ⭐⭐ NO CONTAINMENT BRANCH, AND THAT IS NOT A SIMPLIFICATION — it is the enumeration
        // being complete. When the origin lies inside the hull, Carathéodory guarantees a
        // subset of ≤ 4 points whose convex combination IS the origin, so that subset's solve
        // returns exactly 0 with non-negative weights and the minimum is 0.
        // ⚠⚠ The first version asked a 400-direction bound whether the pair overlapped, and it
        // was WRONG for four configurations: a bound reading zero means *this sample found no
        // separating plane*, never *there is none*. ⛔ That is a substituted quantity — mistake
        // shape 2 — and it accused the product of returning 5.6e-17 where 0 was demanded.
        // ⚠⚠ 1e-9 ABSOLUTE, and the scale matters: the clouds are unit-sized, so this is a
        // RELATIVE precision of 1e-9 against the coordinates rather than against the answer.
        // ⛔ The near-coplanar shape's true gap is ~1e-7, and demanding nine decimals *of that*
        // would be asking for 1e-16 relative — below what a Gram matrix this ill-conditioned
        // can carry in either implementation, mine or the reference's. ⚠ It was set to 1e-9
        // thickness first and the exact reference itself could not hold nine decimals there.
        expect(Math.abs(got - exact)).toBeLessThan(1e-9);
        if (exact > 1e-9) separated++;
        else overlapping++;
      }
      // ⚠ Both regimes must actually occur, or half the assertion is decoration.
      expect(separated).toBeGreaterThan(8);
      expect(overlapping).toBeGreaterThan(3);
    });
  }
});

/**
 * ⭐⭐⭐ **THE SIMPLEX ROUTINES, VECTORED DIRECTLY — because GJK repairs their mistakes.**
 *
 * ⛔⛔ Measured: dropping the segment's far-vertex clamp, dropping a triangle's vertex region,
 * and dropping the collinear fallback each left all fifty `gapBetween` vectors green. ⚠ GJK
 * iterates, so a wrong intermediate answer is usually corrected by the next support point —
 * which means the composition cannot defend its own parts. ⭐ These contracts are small and
 * hand-checkable, so they are asserted where they are stated.
 */
describe("⭐⭐⭐ nearestOnSimplex — the parts GJK is too forgiving to protect", () => {
  const len = (p: Vec3): number => Math.hypot(p[0], p[1], p[2]);

  it("a single point IS the answer", () => {
    expect(nearestOnSimplex([[3, 4, 0]])).toEqual({ point: [3, 4, 0], keep: [0] });
  });

  describe("segment", () => {
    it("⭐ origin projects BEFORE the first vertex ⇒ that vertex, and the simplex reduces", () => {
      // The segment runs from (2,0,0) away from the origin, so the foot of the perpendicular is
      // behind `a` and the answer must be CLAMPED to `a` rather than extrapolated.
      const r = nearestOnSimplex([
        [2, 0, 0],
        [5, 0, 0],
      ]);
      expect(r.point).toEqual([2, 0, 0]);
      expect(r.keep).toEqual([0]);
    });

    it("⭐ origin projects BEYOND the second vertex ⇒ that vertex", () => {
      const r = nearestOnSimplex([
        [-5, 0, 0],
        [-2, 0, 0],
      ]);
      expect(r.point).toEqual([-2, 0, 0]);
      expect(r.keep).toEqual([1]);
    });

    it("⭐⭐ origin projects INSIDE ⇒ the interior point, and BOTH vertices are kept", () => {
      // (−3,4,0) → (9,4,0) crosses x = 0 at y = 4, so the answer is (0,4,0) at distance 4.
      const r = nearestOnSimplex([
        [-3, 4, 0],
        [9, 4, 0],
      ]);
      expect(r.point[0]).toBeCloseTo(0, 12);
      expect(r.point[1]).toBeCloseTo(4, 12);
      expect(len(r.point)).toBeCloseTo(4, 12);
      expect(r.keep).toEqual([0, 1]);
    });

    it("⛔ a ZERO-LENGTH segment returns the vertex rather than dividing by zero", () => {
      const r = nearestOnSimplex([
        [1, 2, 2],
        [1, 2, 2],
      ]);
      expect(r.point).toEqual([1, 2, 2]);
      expect(len(r.point)).toBeCloseTo(3, 12);
    });
  });

  describe("triangle", () => {
    // ⚠ Chosen so the closest point is the INTERIOR of edge a–b: the triangle lies in the
    // plane x = 1 with z ≥ 5, and |y| is minimised at y = 0, which is strictly between the
    // endpoints' y = ∓3. ⛔ The first version of this fixture put the nearest point on a
    // VERTEX and asserted an edge — it was the vertex region, wearing an edge's label.
    const T: Vec3[] = [
      [1, -3, 5],
      [1, 3, 5],
      [1, 0, 9],
    ];

    it("⭐ the origin's foot lands INSIDE ⇒ all three kept, distance is the plane distance", () => {
      // A triangle in the plane x = 1 spanning y ∈ [0,4], z ∈ [5,9] — shifted so the foot of the
      // perpendicular from the origin, (1,0,5)'s corner region, is... chosen to be interior:
      const inside: Vec3[] = [
        [1, -3, -3],
        [1, 6, -3],
        [1, 0, 6],
      ];
      const r = nearestOnSimplex(inside);
      expect(r.keep).toEqual([0, 1, 2]);
      expect(r.point[0]).toBeCloseTo(1, 12);
      expect(len(r.point)).toBeCloseTo(1, 12);
    });

    it("⭐⭐ the VERTEX region of the third corner ⇒ only that corner survives", () => {
      // ⛔ The mutant that deletes this region left every gapBetween vector green.
      const r = nearestOnSimplex([
        [1, 0, 9],
        [1, 4, 9],
        [1, 0, 5],
      ]);
      expect(r.keep).toEqual([2]);
      expect(r.point).toEqual([1, 0, 5]);
    });

    it("⭐ an EDGE region keeps exactly the two vertices of that edge", () => {
      const r = nearestOnSimplex(T);
      expect(r.keep).toEqual([0, 1]);
      expect(r.point[1]).toBeCloseTo(0, 12);
      expect(r.point[2]).toBeCloseTo(5, 12);
      expect(len(r.point)).toBeCloseTo(Math.sqrt(26), 12);
    });

    it("⛔⛔ a COLLINEAR 'triangle' must not return NaN — it falls back to the better edge", () => {
      // ⚠ Degenerate simplices are routine: three support points of a flat body are collinear
      // whenever the body is. Without the fallback the barycentric denominator is zero and the
      // result is NaN — and one NaN makes every later comparison false, so the pair silently
      // stops capturing with nothing on the glass to say why.
      const r = nearestOnSimplex([
        [2, 0, 0],
        [4, 0, 0],
        [6, 0, 0],
      ]);
      expect(Number.isFinite(r.point[0])).toBe(true);
      expect(Number.isFinite(r.point[1])).toBe(true);
      expect(Number.isFinite(r.point[2])).toBe(true);
      expect(len(r.point)).toBeCloseTo(2, 12);
    });
  });

  describe("tetrahedron", () => {
    const T: Vec3[] = [
      [1, 1, 1],
      [1, -1, -1],
      [-1, 1, -1],
      [-1, -1, 1],
    ];

    it("⭐⭐ the origin INSIDE ⇒ the origin itself, with all four kept", () => {
      const r = nearestOnSimplex(T);
      expect(r.point).toEqual([0, 0, 0]);
      expect(r.keep).toEqual([0, 1, 2, 3]);
    });

    it("⭐ the origin OUTSIDE ⇒ the nearest face's answer, and fewer than four kept", () => {
      const moved: Vec3[] = T.map((p) => [p[0] + 10, p[1], p[2]]);
      const r = nearestOnSimplex(moved);
      expect(r.keep.length).toBeLessThan(4);
      expect(len(r.point)).toBeCloseTo(9, 9);
    });

    it("⛔⛔ a FLAT tetrahedron with the origin outside is NOT containment", () => {
      // ⚠⚠ THE ZERO-VOLUME GUARD, ASSERTED WHERE IT IS STATED. Four coplanar points make every
      // face's plane test read `signD = 0`, which is *not outside* — so without the guard the
      // routine reports the origin as CONTAINED and the gap collapses to 0. ⛔ On the glass that
      // is a pair of bodies that capture each other from any distance at all.
      const flat: Vec3[] = [
        [3, 0, 0],
        [7, 0, 0],
        [3, 4, 0],
        [7, 4, 0],
      ];
      const r = nearestOnSimplex(flat);
      expect(len(r.point)).toBeCloseTo(3, 9);
    });

    it("⭐ a flat tetrahedron CONTAINING the origin in its plane is still containment", () => {
      const flat: Vec3[] = [
        [-2, -2, 0],
        [2, -2, 0],
        [-2, 2, 0],
        [2, 2, 0],
      ];
      expect(len(nearestOnSimplex(flat).point)).toBeCloseTo(0, 12);
    });
  });
});
