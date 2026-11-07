/**
 * ⭐⭐⭐ (2026-11-07, `TILTED_ORBIT_REBUILD_SCOPE.md` §29 — the owner: *"the red or green sections are like ropes tightened around the assembly: if there is a
 * void but the section can cross and continue behind the void then the section shall continue through the void and the gizmo shall travel over the void, if
 * the void is at the edge and there is nothing the rope can tighten to, the rope shall round around the edge and not be suspended in the void … The gizmo
 * therefore travels the red or green section and never waits"*) **THE ROPE** — a section and the gizmo on it, engine-free.
 *
 * Along a loop of the track (G1, the shell: each facet at the parts' outermost point), every place `s` casts straight in along its facet's normal; the
 * first real surface hit is its LANDING (R1 — the gizmo is a POINT, where the piece would land with A + dy; any surface hit, at any depth: a recess, a face
 * far behind). The rope joins the landings in order:
 * * R2 — a STEP (a face parallel to the cast, the landing's depth jumping between two places): the rope draws the step along the normal (the landing
 *   before → its corner at the landing after's depth → the landing after); the gizmo JUMPS across it (the owner: *"jump across the bottom segment"*).
 * * R3 — a VOID (no landing for a run of places): the rope goes STRAIGHT from the last landing before it to the first landing after it — across the void
 *   when the line continues beyond it (the gizmo travels over the void), round the edge when it is open at the edge (the next landing is the next face's:
 *   the rope wraps the corner, never hangs in the air). A void reaching the drawn reach's end looks on along the loop for its landing.
 * * R4 — over an EDGE of the track (two places on different facets): the landings joined as they are — a slight jump of the gizmo is accepted.
 * * R5 — THE GIZMO NEVER WAITS: its place on the rope is the rope's length at `s`; where the rope advances slower than `MIN_PACE` of the track (a corner the
 *   rope wraps: zero length for the strip of track beyond the real face), the length is spread over a window round it (≤ `WINDOW_MAX_M` each side) so the
 *   gizmo slows there but always moves; outside every window it is exactly the landing at `s`.
 * ⛔ ENGINE-FREE.
 */
import { dot, type Vec3 } from "../core/vec";

/** ⭐ A place on the loop: its point on the track, its facet and the facet's outward normal. */
export interface RopePlace {
  readonly p: Vec3;
  readonly facet: number;
  readonly n: Vec3;
}

/** ⭐ A landing: the point hit, the part hit (if known). */
export interface Landing {
  readonly point: Vec3;
  readonly host: string | null;
}

/** ⭐ A vertex of the rope: its point, the track arc it belongs to, the facet normal there, the part (a landing's), and whether the segment TO it spans a void. */
export interface RopeVertex {
  readonly p: Vec3;
  readonly s: number;
  readonly n: Vec3;
  readonly host: string | null;
  readonly void: boolean;
}

/** ⭐ A rope: its vertices in arc order (the first and last may lie beyond the drawn reach — `from`, `to`), the reach. */
export interface Rope {
  readonly verts: readonly RopeVertex[];
  readonly from: number;
  readonly to: number;
}

/** ⭐ R2: a depth difference between two landings beyond this is a step (m). */
export const STEP_TOL_M = 0.002;
/** ⭐ The refinement's depth (halvings of a sample interval): 12 mm → 0.19 mm. */
const MAX_DEPTH = 6;
/** ⭐ R5: the slowest the gizmo may go along the rope, as a share of the track's pace — and the widest window that spreads it (m, each side). */
export const MIN_PACE = 0.35;
export const WINDOW_MAX_M = 0.05;
const WINDOW_STEP_M = 0.002;

type Sample = { s: number; q: RopePlace; L: Landing | null };

/**
 * ⭐⭐⭐ THE ROPE over the arc `[from, to]` of a loop of length `total` (`closed`: the reach is the whole loop): `at(s)` the place, `land(q)` its landing.
 * Sampled every `step`, refined (halvings) only where a step or a void's edge lies between two samples.
 */
export function buildRope(at: (s: number) => RopePlace, land: (q: RopePlace) => Landing | null, from: number, to: number, step: number, total: number): Rope {
  const sample = (s: number): Sample => {
    const q = at(s);
    return { s, q, L: land(q) };
  };
  const depthGap = (a: Sample, b: Sample): number => (a.L !== null && b.L !== null ? dot([b.L.point[0] - a.L.point[0], b.L.point[1] - a.L.point[1], b.L.point[2] - a.L.point[2]], a.q.n) : 0);
  const needs = (a: Sample, b: Sample): boolean => {
    if ((a.L === null) !== (b.L === null)) return true;
    if (a.L === null || b.L === null) return false;
    return a.q.facet === b.q.facet && Math.abs(depthGap(a, b)) > STEP_TOL_M;
  };
  const refine = (a: Sample, b: Sample, d: number, out: Sample[]): void => {
    if (d >= MAX_DEPTH || !needs(a, b)) return;
    const m = sample((a.s + b.s) / 2);
    refine(a, m, d + 1, out);
    out.push(m);
    refine(m, b, d + 1, out);
  };
  // the base samples, 0 (the place itself) among them
  const span = Math.max(0, to - from);
  const k = Math.max(2, Math.ceil(span / Math.max(1e-4, step)));
  const arcs: number[] = [];
  for (let i = 0; i <= k; i++) arcs.push(from + (i / k) * span);
  if (from <= 0 && to >= 0 && !arcs.some((a) => Math.abs(a) < 1e-9)) {
    arcs.push(0);
    arcs.sort((x, y) => x - y);
  }
  let base: Sample[] = arcs.map(sample);
  // R3 — a void reaching an end of the reach: its landing looked for on along the loop (at most a turn)
  const reachOut = (edge: Sample, dir: 1 | -1): Sample[] => {
    if (edge.L !== null) return [];
    const lim = span >= total - 1e-6 ? total / 2 : Math.max(0, total - span);
    for (let d = step; d <= lim + 1e-9; d += step) {
      const s = edge.s + dir * d;
      const x = sample(s);
      if (x.L !== null) return [x];
    }
    return [];
  };
  base = [...reachOut(base[0]!, -1), ...base, ...reachOut(base[base.length - 1]!, 1)];
  const fine: Sample[] = [base[0]!];
  for (let i = 1; i < base.length; i++) {
    refine(base[i - 1]!, base[i]!, 0, fine);
    fine.push(base[i]!);
  }
  // the vertices: the landings in order; a step's corner (R2); a void spanned straight (R3)
  const verts: RopeVertex[] = [];
  let last: Sample | null = null;
  let inVoid = false;
  for (const x of fine) {
    if (x.L === null) {
      if (last !== null) inVoid = true;
      continue;
    }
    if (last !== null && !inVoid && last.L !== null && last.q.facet === x.q.facet) {
      const dd = depthGap(last, x);
      if (Math.abs(dd) > STEP_TOL_M) {
        const n = last.q.n;
        const c: Vec3 = [last.L.point[0] + n[0] * dd, last.L.point[1] + n[1] * dd, last.L.point[2] + n[2] * dd];
        verts.push({ p: c, s: last.s, n, host: null, void: false });
      }
    }
    verts.push({ p: x.L.point, s: x.s, n: x.q.n, host: x.L.host, void: inVoid });
    inVoid = false;
    last = x;
  }
  return { verts, from, to };
}

/** ⭐ The rope's cumulative length at each vertex. */
function lengths(r: Rope): number[] {
  const out: number[] = [];
  let acc = 0;
  r.verts.forEach((v, i) => {
    if (i > 0) {
      const a = r.verts[i - 1]!.p;
      acc += Math.hypot(v.p[0] - a[0], v.p[1] - a[1], v.p[2] - a[2]);
    }
    out.push(acc);
  });
  return out;
}

/** ⭐ The rope's length reached at arc `s` (piecewise linear in `s`; a step — two vertices at one arc — taken whole at that arc: the jump). */
function lamAt(r: Rope, lam: readonly number[], s: number): number {
  const v = r.verts;
  if (v.length === 0) return 0;
  if (s <= v[0]!.s) return 0;
  for (let i = 1; i < v.length; i++) {
    const a = v[i - 1]!;
    const b = v[i]!;
    if (s < b.s) {
      const t = b.s > a.s ? (s - a.s) / (b.s - a.s) : 1;
      return lam[i - 1]! + (lam[i]! - lam[i - 1]!) * t;
    }
  }
  return lam[lam.length - 1]!;
}

/** ⭐ R5 — the windows where the rope advances slower than `MIN_PACE` of the track, each grown until the rope's length over it keeps that pace. */
function windows(r: Rope, lam: readonly number[]): { lo: number; hi: number }[] {
  const v = r.verts;
  const out: { lo: number; hi: number }[] = [];
  if (v.length < 2) return out;
  const sLo = v[0]!.s;
  const sHi = v[v.length - 1]!.s;
  for (let i = 1; i < v.length; i++) {
    const a = v[i - 1]!;
    const b = v[i]!;
    const ds = b.s - a.s;
    if (ds <= 1e-6 || lam[i]! - lam[i - 1]! >= MIN_PACE * ds) continue;
    let w = 0;
    while (w < WINDOW_MAX_M) {
      const lo = Math.max(sLo, a.s - w);
      const hi = Math.min(sHi, b.s + w);
      if (lamAt(r, lam, hi) - lamAt(r, lam, lo) >= MIN_PACE * (hi - lo)) break;
      if (lo <= sLo && hi >= sHi) break;
      w += WINDOW_STEP_M;
    }
    const lo = Math.max(sLo, a.s - w);
    const hi = Math.min(sHi, b.s + w);
    const prev = out[out.length - 1];
    if (prev !== undefined && lo <= prev.hi) prev.hi = Math.max(prev.hi, hi);
    else out.push({ lo, hi });
  }
  return out;
}

/** ⭐ The rope's point at cumulative length `l`, with the vertex the segment ends at. */
function pointAtLength(r: Rope, lam: readonly number[], l: number): { p: Vec3; i: number } {
  const v = r.verts;
  for (let i = 1; i < v.length; i++) {
    if (l <= lam[i]! + 1e-12) {
      const a = v[i - 1]!.p;
      const b = v[i]!.p;
      const seg = lam[i]! - lam[i - 1]!;
      const t = seg > 1e-12 ? (l - lam[i - 1]!) / seg : 1;
      return { p: [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t], i };
    }
  }
  return { p: v[v.length - 1]!.p, i: v.length - 1 };
}

/**
 * ⭐⭐⭐ THE GIZMO ON THE ROPE at the track's arc `s` (R5): the rope's length there (spread over the slow windows), its point; the part when it lies on a
 * landing's segment (not a void's); `null`: a rope with no landing at all.
 */
export function ropeAt(r: Rope, s: number): { readonly p: Vec3; readonly n: Vec3; readonly host: string | null; readonly overVoid: boolean } | null {
  const v = r.verts;
  if (v.length === 0) return null;
  if (v.length === 1) return { p: v[0]!.p, n: v[0]!.n, host: v[0]!.host, overVoid: false };
  const lam = lengths(r);
  let l = lamAt(r, lam, s);
  for (const w of windows(r, lam)) {
    if (s > w.lo && s < w.hi) {
      const l0 = lamAt(r, lam, w.lo);
      const l1 = lamAt(r, lam, w.hi);
      l = l0 + ((l1 - l0) * (s - w.lo)) / (w.hi - w.lo);
      break;
    }
  }
  const at = pointAtLength(r, lam, l);
  const end = v[at.i]!;
  return { p: at.p, n: end.n, host: end.void ? null : end.host, overVoid: end.void };
}

/** ⭐ The rope as drawn: its polyline clipped to the reach `[from, to]` (a segment crossing an end cut there, by arc). */
export function ropeDrawn(r: Rope): { readonly p: Vec3; readonly n: Vec3; readonly s: number }[] {
  const v = r.verts;
  const out: { p: Vec3; n: Vec3; s: number }[] = [];
  const lerp = (a: RopeVertex, b: RopeVertex, s: number): Vec3 => {
    const t = b.s > a.s ? (s - a.s) / (b.s - a.s) : 0;
    return [a.p[0] + (b.p[0] - a.p[0]) * t, a.p[1] + (b.p[1] - a.p[1]) * t, a.p[2] + (b.p[2] - a.p[2]) * t];
  };
  for (let i = 0; i < v.length; i++) {
    const x = v[i]!;
    if (x.s < r.from - 1e-9) {
      const y = v[i + 1];
      if (y !== undefined && y.s > r.from) out.push({ p: lerp(x, y, r.from), n: x.n, s: r.from });
      continue;
    }
    if (x.s > r.to + 1e-9) {
      const w = v[i - 1];
      if (w !== undefined && w.s < r.to) out.push({ p: lerp(w, x, r.to), n: x.n, s: r.to });
      break;
    }
    out.push({ p: x.p, n: x.n, s: x.s });
  }
  return out;
}
