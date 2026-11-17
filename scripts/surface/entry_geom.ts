// THE ENTRY-SET CHECK — the geometry (ORBIT_SURFACE.md §2.5, B4; package S0 of ORBIT_SURFACE_BUILD.md). Offline, engine-free, millimetres in the
// MODEL's (scene) frame. A goal's ENTRY SET at a stage: the directions d along which the part, withdrawn from its seated pose, never sinks into a
// placed part's collision piece by more than the contact tolerance.
//
// ⭐ THE METHOD (exact, no time step): for a moving convex piece A and a still convex piece B, A moved by x meets B exactly when x lies in the
// Minkowski difference M = B ⊖ A = { b − a } (a convex polytope: van den Bergen, "Collision Detection in Interactive 3D Environments", 2003, ch. 4;
// the textbook configuration-space obstacle of Lozano-Pérez 1983). Written as half-spaces n_i · x ≤ h_i (unit n_i, h_i = M's support along n_i),
// the PENETRATION DEPTH of A + x into B is depth(x) = min_i (h_i − n_i · x) for x inside M (the distance to M's nearest facet), negative outside.
// Along the withdrawal x = t d (t ≥ 0) depth is the minimum of affine functions of t, so "∃ t > 0 with depth(t d) > thr" is a one-dimensional
// interval test over the facets — exact, whatever the distance travelled (no tunnelling, no step).
// ⭐ THE CONTACT AT THE SEAT (the game's own rule, collision.ts `poseFree`, D136): contact is allowed, only penetration deeper than the skin is
// refused, and a pair ALREADY deeper may only get shallower. So thr = max(skin, depth(0)): a part resting on a face may slide along it (depth stays
// ≤ 0) and leave it (depth falls), never push into it (depth grows past the skin).
import { convexHull3 } from "../../src/core/hull3";

export type V = [number, number, number];
export const dot = (a: readonly number[], b: readonly number[]): number => a[0]! * b[0]! + a[1]! * b[1]! + a[2]! * b[2]!;
export const sub = (a: readonly number[], b: readonly number[]): V => [a[0]! - b[0]!, a[1]! - b[1]!, a[2]! - b[2]!];
export const cross = (a: readonly number[], b: readonly number[]): V => [a[1]! * b[2]! - a[2]! * b[1]!, a[2]! * b[0]! - a[0]! * b[2]!, a[0]! * b[1]! - a[1]! * b[0]!];
export const len = (a: readonly number[]): number => Math.hypot(a[0]!, a[1]!, a[2]!);
export const unit = (a: readonly number[]): V => { const l = len(a); return [a[0]! / l, a[1]! / l, a[2]! / l]; };
export const deg = (r: number) => (r * 180) / Math.PI;
export const angleBetween = (a: V, b: V) => Math.acos(Math.max(-1, Math.min(1, dot(a, b))));

/** a convex collision piece: its hull's vertices and its hull's face normals (outward, unit, distinct), millimetres */
export interface Piece { owner: string; label: string; pts: V[]; normals: V[]; edges: V[] }

/** distinct unit vectors (the same to 1e-9 in every component; a near-duplicate kept is harmless: every normal is a supporting plane) */
function distinct(vs: V[]): V[] {
  const seen = new Set<string>();
  const out: V[] = [];
  for (const v of vs) { const k = v.map((x) => Math.round(x * 1e9)).join(","); if (!seen.has(k)) (seen.add(k), out.push(v)); }
  return out;
}

/** the hull of a point set: its vertices, its triangles' normals and edge directions (from the ORIGINAL points; `makePair` makes each normal a supporting plane) */
function hullOf(points: readonly V[], what: string): { pts: V[]; normals: V[]; edges: V[] } {
  const h = convexHull3(points);
  if (h === null) throw new Error(`${what}: degenerate (no 3D hull)`);
  const used = new Set<number>();
  const ns: V[] = [];
  const es: V[] = [];
  let size = 0;
  for (const p of h.points) size = Math.max(size, len(sub(p, h.points[0]!)));
  for (const [a, b, c] of h.triangles) {
    used.add(a), used.add(b), used.add(c);
    const A = h.points[a]!, B = h.points[b]!, C = h.points[c]!;
    for (const [p, q] of [[A, B], [B, C], [C, A]]) { const e = sub(q!, p!); const l = len(e); if (l > 1e-9 * size) { const u = unit(e); es.push(u[0] < 0 || (u[0] === 0 && (u[1] < 0 || (u[1] === 0 && u[2] < 0))) ? [-u[0], -u[1], -u[2]] : u); } }
    const n = cross(sub(B, A), sub(C, A));
    // ⚠ a sliver of the joggled triangulation (three nearly collinear points) has no normal worth keeping
    if (len(n) <= 1e-9 * size * size) continue;
    ns.push(unit(n));
  }
  return { pts: [...used].map((i) => [h.points[i]![0], h.points[i]![1], h.points[i]![2]] as V), normals: distinct(ns), edges: distinct(es) };
}

export function makePiece(owner: string, label: string, points: readonly V[]): Piece {
  const h = hullOf(points, `${owner}/${label}`);
  return { owner, label, pts: h.pts, normals: h.normals, edges: h.edges };
}

/** M = B ⊖ A as half-spaces n · x ≤ h, plus its box (a cheap reject) */
export interface Pair { a: Piece; b: Piece; n: V[]; h: number[]; lo: V; hi: V; depth0: number }

const support = (pts: readonly V[], n: V) => { let m = -Infinity; for (const p of pts) m = Math.max(m, dot(p, n)); return m; };

/** ⭐ THE PAIR'S OBSTACLE: the hull of { b − a } — its face normals, each made a SUPPORTING plane of M (h = max over B − min over A) */
export function makePair(a: Piece, b: Piece): Pair {
  const diff: V[] = [];
  for (const q of b.pts) for (const p of a.pts) diff.push(sub(q, p));
  const hm = hullOf(diff, `${a.owner}/${a.label} vs ${b.owner}/${b.label}`);
  // the pieces' own face normals are facets of M too (kept even where the triangulation dropped one)
  const n = distinct([...hm.normals, ...a.normals.map((v) => [-v[0], -v[1], -v[2]] as V), ...b.normals]);
  const h = n.map((v) => support(b.pts, v) - Math.min(...a.pts.map((p) => dot(p, v))));
  const lo: V = [0, 1, 2].map((k) => Math.min(...diff.map((d) => d[k]!))) as V;
  const hi: V = [0, 1, 2].map((k) => Math.max(...diff.map((d) => d[k]!))) as V;
  return { a, b, n, h, lo, hi, depth0: Math.min(...h) };
}

/**
 * ⭐ A SECOND IMPLEMENTATION of M's half-spaces (the separating-axis theorem: the facets of a Minkowski sum of polytopes are among A's face normals,
 * B's face normals and the cross products of an edge of A with an edge of B — Gottschalk, Lin, Manocha 1996, "OBBTree"; the edges here are the
 * hull triangulation's, diagonals included: a superset). It shares only the hull of each PIECE with `makePair`, not the hull of M. Used only by the
 * cross-check: it must give the same depths and verdicts.
 */
export function makePairSat(a: Piece, b: Piece): Pair {
  const ea = a.edges, eb = b.edges;
  const cand: V[] = [...a.normals.map((v) => [-v[0], -v[1], -v[2]] as V), ...b.normals];
  for (const u of ea) for (const w of eb) { const c = cross(u, w); if (len(c) > 1e-6) { const k = unit(c); cand.push(k, [-k[0], -k[1], -k[2]]); } }
  const n = distinct(cand);
  const h = n.map((v) => support(b.pts, v) - Math.min(...a.pts.map((p) => dot(p, v))));
  return { a, b, n, h, lo: [-Infinity, -Infinity, -Infinity], hi: [Infinity, Infinity, Infinity], depth0: Math.min(...h) };
}

/** the depth of A + x into B (mm): > 0 overlapping by that much, ≤ 0 apart or touching */
export const depthAt = (P: Pair, x: V) => { let m = Infinity; for (let i = 0; i < P.n.length; i++) m = Math.min(m, P.h[i]! - dot(P.n[i]!, x)); return m; };

/** the ray t d (t > 0) against the box of M grown by g: may it enter at all? */
function rayHitsBox(P: Pair, d: V, g: number): boolean {
  let lo = 0, hi = Infinity;
  for (let k = 0; k < 3; k++) {
    const a = P.lo[k]! - g, b = P.hi[k]! + g, dk = d[k]!;
    if (Math.abs(dk) < 1e-15) { if (0 < a || 0 > b) return false; continue; }
    const t1 = a / dk, t2 = b / dk;
    lo = Math.max(lo, Math.min(t1, t2)); hi = Math.min(hi, Math.max(t1, t2));
    if (lo > hi) return false;
  }
  return true;
}

/** the t > 0 interval where every facet i keeps  t · (n_i · d) < h_i − c  (strict by `eps` mm) — null when empty */
function interval(P: Pair, d: V, c: number, eps: number): [number, number] | null {
  let lo = 0, hi = Infinity;
  for (let i = 0; i < P.n.length; i++) {
    const a = dot(P.n[i]!, d), r = P.h[i]! - c;
    if (Math.abs(a) < 1e-12) { if (r <= eps) return null; continue; }
    if (a > 0) hi = Math.min(hi, (r - eps) / a);
    else lo = Math.max(lo, (r - eps) / a);
    if (lo >= hi) return null;
  }
  return hi > 0 ? [lo, hi] : null;
}

/**
 * ⭐ IS THE WITHDRAWAL ALONG d BLOCKED BY THIS PAIR? — ∃ t > 0: depth(t d) > max(skin, depth(0)) (the game's rule: contact allowed, only penetration
 * past the skin refused, a pair already deeper may only get shallower). Exact over the whole ray. `eps` 1e-6 mm: a strict inequality in floats.
 */
export function blocked(P: Pair, d: V, skin: number): boolean {
  const thr = Math.max(skin, P.depth0);
  if (!rayHitsBox(P, d, 0)) return false;
  return interval(P, d, thr, 1e-6) !== null;
}

/** ⭐ how far along d (mm) until A is out of CONTACT with B for good (depth below −c, c the skin): the end of the ray's stay in M grown by c; 0 if never in it */
export function clearAlong(P: Pair, d: V, c: number): number {
  if (!rayHitsBox(P, d, c + 1e-9)) return 0;
  const iv = interval(P, d, -c, -1e-9);
  return iv === null ? 0 : iv[1];
}

/** ⭐ the study's sphere (checks.ts `sphere`, the golden spiral) — the SAME samples, so the shares compare exactly */
export function sphere(n: number): V[] {
  const out: V[] = [];
  const ga = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < n; i++) { const y = 1 - (2 * (i + 0.5)) / n, r = Math.sqrt(1 - y * y), th = ga * i; out.push([r * Math.cos(th), y, r * Math.sin(th)]); }
  return out;
}

/** a direction rotated toward another by angle `a` along their great circle */
export function slerpDir(p: V, q: V, a: number): V {
  const w = angleBetween(p, q);
  if (w < 1e-12) return p;
  const s = Math.sin(w), k1 = Math.sin(w - a) / s, k2 = Math.sin(a) / s;
  return unit([p[0] * k1 + q[0] * k2, p[1] * k1 + q[1] * k2, p[2] * k1 + q[2] * k2]);
}

export interface EntryResult {
  /** the sphere's samples */
  sampled: number;
  freeSamples: number;
  sharePct: number;
  /** the exact directions tried (face normals ±, the plan's), each free or blocked, with the parts that block it */
  exact: { label: string; d: V; free: boolean; blockers: string[]; openingDeg: number; clearMm: number }[];
  /** the free set's connected regions: each its inscribed opening (deg) and a representative direction */
  regions: { members: number; openingDeg: number; centre: V; exactOnly: boolean }[];
  widestDeg: number;
  narrowestDeg: number;
  /** pairs in contact at the seat (depth0 > −skin) and pairs overlapping past the skin (an authored interference) */
  seatContacts: string[];
  seatOverlaps: { pair: string; depthMm: number }[];
}

/**
 * ⭐ THE ENTRY SET of a part (its pieces at the goal) against a placed set: the sphere's samples PLUS the given exact directions; each direction
 * free when no pair blocks it. The OPENING of a free direction: the angle to the nearest blocked direction, bisected (14 rounds) along the arcs toward
 * the 6 nearest blocked samples — an UPPER bound of the true one by at most about half the samples' spacing (≈ 4°). Regions: free directions joined
 * when less than 1.6 × the spacing apart and the arc's midpoint is free.
 */
export function entrySet(part: Piece[], placed: Piece[], exactDirs: { label: string; d: V }[], skin: number, nSphere: number, pairOf: (a: Piece, b: Piece) => Pair = makePair): EntryResult {
  const pairs: Pair[] = [];
  for (const a of part) for (const b of placed) pairs.push(pairOf(a, b));
  const freeAt = (d: V) => { for (const P of pairs) if (blocked(P, d, skin)) return false; return true; };
  const blockersAt = (d: V) => [...new Set(pairs.filter((P) => blocked(P, d, skin)).map((P) => P.b.owner))].sort();
  const sph = sphere(nSphere);
  const sFree = sph.map(freeAt);
  const blockedS = sph.filter((_, i) => !sFree[i]);
  const spacing = Math.sqrt((4 * Math.PI) / nSphere);
  const opening = (d: V): number => {
    if (blockedS.length === 0) return 180;
    const near = blockedS.map((b) => ({ b, a: angleBetween(d, b) })).sort((x, y) => x.a - y.a).slice(0, 6);
    let best = Infinity;
    for (const { b, a } of near) {
      let lo = 0, hi = a; // free at lo, blocked at hi
      for (let k = 0; k < 14; k++) { const m = (lo + hi) / 2; if (freeAt(slerpDir(d, b, m))) lo = m; else hi = m; }
      best = Math.min(best, hi);
    }
    return deg(best);
  };
  const exact = exactDirs.map(({ label, d }) => {
    const f = freeAt(d);
    return { label, d, free: f, blockers: f ? [] : blockersAt(d), openingDeg: f ? opening(d) : 0, clearMm: f ? Math.max(0, ...pairs.map((P) => clearAlong(P, d, skin))) : NaN };
  });
  // the regions
  const nodes: { d: V; open: number; exact: boolean }[] = [
    ...sph.filter((_, i) => sFree[i]).map((d) => ({ d, open: opening(d), exact: false })),
    ...exact.filter((e) => e.free).map((e) => ({ d: e.d, open: e.openingDeg, exact: true })),
  ];
  const parent = nodes.map((_, i) => i);
  const find = (i: number): number => (parent[i] === i ? i : (parent[i] = find(parent[i]!)));
  for (let i = 0; i < nodes.length; i++) for (let j = i + 1; j < nodes.length; j++) {
    const a = angleBetween(nodes[i]!.d, nodes[j]!.d);
    if (a < 1e-9 || (a < 1.6 * spacing && freeAt(slerpDir(nodes[i]!.d, nodes[j]!.d, a / 2)))) parent[find(i)] = find(j);
  }
  const groups = new Map<number, number[]>();
  nodes.forEach((_, i) => { const r = find(i); groups.set(r, [...(groups.get(r) ?? []), i]); });
  const regions = [...groups.values()].map((ix) => {
    const best = ix.reduce((m, i) => (nodes[i]!.open > nodes[m]!.open ? i : m), ix[0]!);
    return { members: ix.length, openingDeg: nodes[best]!.open, centre: nodes[best]!.d, exactOnly: ix.every((i) => nodes[i]!.exact) };
  }).sort((x, y) => y.openingDeg - x.openingDeg);
  const seatContacts = [...new Set(pairs.filter((P) => P.depth0 > -skin).map((P) => P.b.owner))].sort();
  const seatOverlaps = pairs.filter((P) => P.depth0 > skin).map((P) => ({ pair: `${P.a.owner}/${P.a.label} × ${P.b.owner}/${P.b.label}`, depthMm: P.depth0 }));
  const freeSamples = sFree.filter(Boolean).length;
  return {
    sampled: nSphere, freeSamples, sharePct: (100 * freeSamples) / nSphere, exact, regions,
    widestDeg: regions.length ? regions[0]!.openingDeg : 0, narrowestDeg: regions.length ? regions[regions.length - 1]!.openingDeg : 0,
    seatContacts, seatOverlaps,
  };
}

/** the exact directions: ± every face normal of the given pieces, distinct */
export function normalDirs(pieces: Piece[]): V[] {
  const all: V[] = [];
  for (const p of pieces) for (const n of p.normals) all.push(n, [-n[0], -n[1], -n[2]]);
  return distinct(all.map((v) => v.map((x) => (Math.abs(x) < 1e-12 ? 0 : x)) as V));
}

/**
 * ⭐ THE PRE-INSERTION POSE along a free direction d (ORBIT_SURFACE.md §2.5: "the part withdrawn along it until it first clears the placed set"):
 * the placed pieces the part passes BESIDE on its way out — those within `besideMm` of the part's swept volume (the hull of each piece and of the
 * same piece far along d: the exact sweep of a convex piece; the gap by the game's own GJK, collision_shape.ts `gapBetween`) — and the travel
 * after which the part lies wholly BEYOND every one of them along d (its rearmost point past their foremost). 0 when nothing is beside it or
 * everything beside it is behind. `besideMm` is the study's (stated where it is used), not a game constant.
 */
export function mouthAlong(part: Piece[], placed: Piece[], d: V, besideMm: number, gap: (a: readonly V[], b: readonly V[]) => number | null): { mm: number; by: string[]; decisive: string } {
  const FAR = 1e5;
  const swept = part.map((p) => [...p.pts, ...p.pts.map((q) => [q[0] + d[0] * FAR, q[1] + d[1] * FAR, q[2] + d[2] * FAR] as V)]);
  let rear = Infinity;
  for (const p of part) for (const q of p.pts) rear = Math.min(rear, dot(q, d));
  let mm = 0, decisive = "";
  const by = new Set<string>();
  for (const b of placed) {
    const front = Math.max(...b.pts.map((q) => dot(q, d)));
    if (front - rear <= 0) continue; // already behind the part
    if (!swept.some((s) => { const g = gap(s, b.pts); return g !== null && g <= besideMm; })) continue;
    if (front - rear > mm) (mm = front - rear, decisive = `${b.owner}/${b.label}`);
    by.add(b.owner);
  }
  return { mm, by: [...by].sort(), decisive };
}
