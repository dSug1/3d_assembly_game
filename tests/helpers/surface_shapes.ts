/**
 * ⭐ THE SURFACE STUDY'S SHAPES AND ITS BRUTE-FORCE P READING, rebuilt for the landing map's vectors (`ORBIT_SURFACE_LANDING_MAP.md` §8; package S1).
 * A copy of `scripts/probes/surface_study/geom.ts` (`boxPart`, `hullPart`, `prismZ`, `blockLess`, `prismLevels`), of `shapes.ts` (the library L01 –
 * L53 and the pairs Q01 – Q10: their parts, their studied facets and travels — the expectations' text left out) and of `readings.ts` `propFar` (the
 * study's P reading: the highest level of any part inside the held footprint's prism, or "nothing" — the SECOND IMPLEMENTATION of the landing).
 * ⛔ Rebuilt, not imported: a test does not import from `scripts/` (`chart_shapes.ts`). ⭐ The offline run `scripts/surface/landing_compare.ts`
 * checks that this copy builds the study's parts BIT FOR BIT. Millimetres, y up, the block 480 × 240 × 480 (x, z centred, y 0 … 240).
 */
import { convexHull3 } from "../../src/core/hull3";
import type { Vec3 } from "../../src/core/vec";

export type V = [number, number, number];
const dot = (a: readonly number[], b: readonly number[]): number => a[0]! * b[0]! + a[1]! * b[1]! + a[2]! * b[2]!;
const sub = (a: V, b: V): V => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const add = (a: V, b: V): V => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const mul = (a: V, k: number): V => [a[0] * k, a[1] * k, a[2] * k];

export interface Plane { n: V; e: number }
export interface Part { id: string; lo: V; hi: V; isBox: boolean; planes: Plane[]; verts: V[]; edges: [V, V][] }

export function boxPart(id: string, lo: V, hi: V): Part {
  const [x0, y0, z0] = lo, [x1, y1, z1] = hi;
  const verts: V[] = [];
  for (const x of [x0, x1]) for (const y of [y0, y1]) for (const z of [z0, z1]) verts.push([x, y, z]);
  const planes: Plane[] = [
    { n: [1, 0, 0], e: x1 }, { n: [-1, 0, 0], e: -x0 }, { n: [0, 1, 0], e: y1 }, { n: [0, -1, 0], e: -y0 }, { n: [0, 0, 1], e: z1 }, { n: [0, 0, -1], e: -z0 },
  ];
  const edges: [V, V][] = [];
  for (let i = 0; i < 8; i++) for (let j = i + 1; j < 8; j++) {
    const d = sub(verts[j]!, verts[i]!);
    if ([0, 1, 2].filter((k) => Math.abs(d[k]!) > 0).length === 1) edges.push([verts[i]!, verts[j]!]);
  }
  return { id, lo: [x0, y0, z0], hi: [x1, y1, z1], isBox: true, planes, verts, edges };
}

/** a convex part from points (their hull), as the study's `hullPart` (its planes grouped by plane) */
export function hullPart(id: string, pts: V[]): Part {
  const h = convexHull3(pts);
  if (h === null) throw new Error(`hullPart ${id}: degenerate`);
  const planes: Plane[] = [];
  const edgeSet = new Map<string, [V, V]>();
  const key = (v: V) => v.map((x) => x.toFixed(4)).join(",");
  for (const [a, b, c] of h.triangles) {
    const A = [...h.points[a]!] as V, B = [...h.points[b]!] as V, C = [...h.points[c]!] as V;
    const cr: V = [(B[1] - A[1]) * (C[2] - A[2]) - (B[2] - A[2]) * (C[1] - A[1]), (B[2] - A[2]) * (C[0] - A[0]) - (B[0] - A[0]) * (C[2] - A[2]), (B[0] - A[0]) * (C[1] - A[1]) - (B[1] - A[1]) * (C[0] - A[0])];
    const l = Math.hypot(cr[0], cr[1], cr[2]);
    const n: V = l > 1e-15 ? [cr[0] / l, cr[1] / l, cr[2] / l] : [0, 1, 0];
    const e = dot(n, A);
    if (!planes.some((g) => dot(g.n, n) > 1 - 1e-9 && Math.abs(g.e - e) < 1e-6)) planes.push({ n, e });
    for (const [p, q] of [[A, B], [B, C], [C, A]] as [V, V][]) {
      const k = [key(p), key(q)].sort().join("|");
      if (!edgeSet.has(k)) edgeSet.set(k, [p, q]);
    }
  }
  const verts = h.points.map((p) => [p[0], p[1], p[2]] as V);
  const lo = [0, 1, 2].map((k) => Math.min(...verts.map((v) => v[k]!))) as V;
  const hi = [0, 1, 2].map((k) => Math.max(...verts.map((v) => v[k]!))) as V;
  return { id, lo, hi, isBox: false, planes, verts, edges: [...edgeSet.values()] };
}
/** a prism: a convex polygon in (x, y), extruded along z from z0 to z1 */
export const prismZ = (id: string, poly: [number, number][], z0: number, z1: number): Part => hullPart(id, poly.flatMap(([x, y]): V[] => [[x, y, z0], [x, y, z1]]));

/** ⭐ THE STUDY'S P READING, its core (`geom.ts` `prismLevels`, copied): the lowest and highest n·x of a part inside the OPEN prism of the footprint */
const OPEN = 1e-4; // mm: the footprint shrunk by this — "touching is not over"
export function prismLevels(p: Part, n: V, t: V, b: V, L: number, s: number, a: number, c: number): [number, number] | null {
  const a2 = a - OPEN, c2 = c - OPEN;
  if (p.isBox) {
    const iv = (u: V): [number, number] => { let lo = 0, hi = 0; for (let k = 0; k < 3; k++) { const x0 = p.lo[k]! * u[k]!, x1 = p.hi[k]! * u[k]!; lo += Math.min(x0, x1); hi += Math.max(x0, x1); } return [lo, hi]; };
    const T = iv(t), B = iv(b);
    if (Math.min(T[1], L + a2) - Math.max(T[0], L - a2) <= 0) return null;
    if (Math.min(B[1], s + c2) - Math.max(B[0], s - c2) <= 0) return null;
    if ([n, t, b].every((u) => Math.abs(Math.abs(u[0]) + Math.abs(u[1]) + Math.abs(u[2]) - 1) < 1e-9)) return iv(n);
  }
  let lo = Infinity, hi = -Infinity;
  const take = (x: V) => { const h = dot(n, x); if (h < lo) lo = h; if (h > hi) hi = h; };
  const inRect = (x: V) => Math.abs(dot(t, x) - L) <= a2 + 1e-9 && Math.abs(dot(b, x) - s) <= c2 + 1e-9;
  for (const v of p.verts) if (inRect(v)) take(v);
  for (const [P, Q] of p.edges) {
    const d = sub(Q, P);
    for (const [ax, ctr, half, other, oc, oh] of [[t, L, a2, b, s, c2], [b, s, c2, t, L, a2]] as [V, number, number, V, number, number][]) for (const sg of [-1, 1]) {
      const den = dot(ax, d);
      if (Math.abs(den) < 1e-12) continue;
      const u = (ctr + sg * half - dot(ax, P)) / den;
      if (u < 0 || u > 1) continue;
      const X = add(P, mul(d, u));
      if (Math.abs(dot(other, X) - oc) <= oh + 1e-9) take(X);
    }
  }
  for (const sa of [-1, 1]) for (const sb of [-1, 1]) {
    const O = add(mul(t, L + sa * a2), mul(b, s + sb * c2));
    let hin = -Infinity, hout = Infinity, ok = true;
    for (const pl of p.planes) {
      const den = dot(pl.n, n), dist = pl.e - dot(pl.n, O);
      if (Math.abs(den) < 1e-12) { if (dist < 0) { ok = false; break; } continue; }
      const h = dist / den;
      if (den < 0) hin = Math.max(hin, h); else hout = Math.min(hout, h);
    }
    if (ok && hin <= hout) { take(add(O, mul(n, hin))); take(add(O, mul(n, hout))); }
  }
  return lo <= hi ? [lo, hi] : null;
}

/** the held pieces of the study: half-sizes along t (a) and b (c), height along n (mm) */
export interface BoxPiece { name: string; a: number; c: number; H: number }
export const PIECE_A: BoxPiece = { name: "A 41.3x45", a: 41.3 / 2, c: 45 / 2, H: 48 };
export const PIECE_B: BoxPiece = { name: "B 80x80", a: 40, c: 40, H: 40 };
export const PIECE_BAR: BoxPiece = { name: "bar 20x100", a: 10, c: 50, H: 20 };
export const PIECE_BAR_T: BoxPiece = { name: "bar 100x20 (turned)", a: 50, c: 10, H: 20 };
export const PIECES: Record<string, BoxPiece> = { A: PIECE_A, B: PIECE_B, bar: PIECE_BAR, barT: PIECE_BAR_T };

/** ⭐ THE BRUTE FORCE (`readings.ts` `propFar`, its body): the highest part over the footprint; none: nothing to land on (mm) */
export function bruteLanding(parts: readonly Part[], n: V, t: V, b: V, L: number, s: number, pc: BoxPiece): { level: number; nothing: boolean; part: string | null } {
  let best: { hi: number; id: string } | null = null;
  for (const p of parts) {
    const r = prismLevels(p, n, t, b, L, s, pc.a, pc.c);
    if (r !== null && (best === null || r[1] > best.hi)) best = { hi: r[1], id: p.id };
  }
  return best === null ? { level: NaN, nothing: true, part: null } : { level: best.hi, nothing: false, part: best.id };
}

/** BOXES OUT OF CELLS: the block less the voids, cut on every bound, merged greedily (x, then z, then y) — `geom.ts` `blockLess`, copied */
export function blockLess(block: { lo: V; hi: V }, voids: { lo: V; hi: V }[], prefix = "b"): Part[] {
  const cuts = (k: 0 | 1 | 2) => [...new Set([block.lo[k], block.hi[k], ...voids.flatMap((v) => [v.lo[k], v.hi[k]])])].filter((c) => c >= block.lo[k] && c <= block.hi[k]).sort((a, b) => a - b);
  const cx = cuts(0), cy = cuts(1), cz = cuts(2);
  const NX = cx.length - 1, NY = cy.length - 1, NZ = cz.length - 1;
  const solid = new Uint8Array(NX * NY * NZ);
  const id = (i: number, j: number, k: number) => (i * NY + j) * NZ + k;
  for (let i = 0; i < NX; i++) for (let j = 0; j < NY; j++) for (let k = 0; k < NZ; k++) {
    const c = [(cx[i]! + cx[i + 1]!) / 2, (cy[j]! + cy[j + 1]!) / 2, (cz[k]! + cz[k + 1]!) / 2];
    if (!voids.some((v) => c.every((x, a) => x > v.lo[a]! && x < v.hi[a]!))) solid[id(i, j, k)] = 1;
  }
  const used = new Uint8Array(NX * NY * NZ);
  const out: Part[] = [];
  const free = (i: number, j: number, k: number) => solid[id(i, j, k)] === 1 && used[id(i, j, k)] === 0;
  for (let j = 0; j < NY; j++) for (let k = 0; k < NZ; k++) for (let i = 0; i < NX; i++) {
    if (!free(i, j, k)) continue;
    let i1 = i; while (i1 + 1 < NX && free(i1 + 1, j, k)) i1++;
    let k1 = k; while (k1 + 1 < NZ && [...Array(i1 - i + 1)].every((_, d) => free(i + d, j, k1 + 1))) k1++;
    let j1 = j; while (j1 + 1 < NY && [...Array(i1 - i + 1)].every((_, d) => [...Array(k1 - k + 1)].every((_, e) => free(i + d, j1 + 1, k + e)))) j1++;
    for (let a = i; a <= i1; a++) for (let b = j; b <= j1; b++) for (let c = k; c <= k1; c++) used[id(a, b, c)] = 1;
    out.push(boxPart(`${prefix}${out.length}`, [cx[i]!, cy[j]!, cz[k]!], [cx[i1 + 1]!, cy[j1 + 1]!, cz[k1 + 1]!]));
  }
  return out;
}

// ───────────────────────────── the library (`shapes.ts`, the parts and the travels) ─────────────────────────────
export interface Line { a: V; b: V }
/** a studied facet: its normal and the frame used here (t, b: in its plane), its travels */
export interface Study { n: V; t: V; b: V; lines: Line[] }
export interface Shape { name: string; parts: Part[]; studies: Study[]; pieces: string[] }

export const TOP = 240;
const BLOCK = { lo: [-240, 0, -240] as V, hi: [240, TOP, 240] as V };
export const base = (): Part[] => [boxPart("base", BLOCK.lo, BLOCK.hi)];
export const bx = (id: string, x0: number, x1: number, y0: number, y1: number, z0: number, z1: number) => boxPart(id, [x0, y0, z0], [x1, y1, z1]);
export const vd = (x0: number, x1: number, z0: number, z1: number, depth: number, y1 = TOP) => ({ lo: [x0, y1 - depth, z0] as V, hi: [x1, y1, z1] as V });
export const withVoids = (voids: { lo: V; hi: V }[]) => blockLess(BLOCK, voids);
const clampT = (x: number) => Math.max(-239.5, Math.min(239.5, x));
function topLines(x: number, z: number, half: number, y = TOP): Line[] {
  return [{ a: [clampT(x - half), y, z], b: [clampT(x + half), y, z] }, { a: [x, y, clampT(z - half)], b: [x, y, clampT(z + half)] }];
}
function frontLines(x: number, ys: number[], zf = 240, yLo = 60, yHi = 239.5): Line[] {
  return [{ a: [x, yLo, zf], b: [x, yHi, zf] }, ...ys.map((y): Line => ({ a: [clampT(x + 150), y, zf], b: [clampT(x - 150), y, zf] }))];
}
/** the frames used by the vectors (a convention of this file; both implementations read the same one) */
export const TOP_F = { n: [0, 1, 0] as V, t: [1, 0, 0] as V, b: [0, 0, 1] as V };
export const FRONT_F = { n: [0, 0, 1] as V, t: [-1, 0, 0] as V, b: [0, 1, 0] as V };
export const BOTTOM_F = { n: [0, -1, 0] as V, t: [1, 0, 0] as V, b: [0, 0, 1] as V };
const top = (lines: Line[]): Study => ({ ...TOP_F, lines });
const front = (lines: Line[]): Study => ({ ...FRONT_F, lines });
const bottom = (lines: Line[]): Study => ({ ...BOTTOM_F, lines });
const IX = -100, IZ = -60;

export function library(): Shape[] {
  const S: Shape[] = [];
  const add2 = (name: string, parts: Part[], studies: Study[], pieces: string[] = ["A", "B"]) => S.push({ name, parts, studies, pieces });
  const thru = (w: number, x: number, z: number) => withVoids([vd(x - w / 2, x + w / 2, z - w / 2, z + w / 2, TOP)]);
  add2("L01", thru(100, IX, IZ), [top(topLines(IX, IZ, 140))]);
  add2("L02", thru(30, IX, IZ), [top(topLines(IX, IZ, 100))]);
  const blind = (w: number, d: number, x = IX, z = IZ) => withVoids([vd(x - w / 2, x + w / 2, z - w / 2, z + w / 2, d)]);
  add2("L03", blind(60, 40), [top(topLines(IX, IZ, 120))]);
  add2("L04", blind(30, 40), [top(topLines(IX, IZ, 100))]);
  const chan1 = withVoids([vd(IX - 30, IX + 30, -100, 260, 30)]);
  add2("L05", chan1, [top(topLines(IX, 80, 160))]);
  add2("L06", withVoids([vd(IX - 30, IX + 30, -260, 260, 30)]), [top(topLines(IX, 0, 160))]);
  add2("L07", chan1, [front(frontLines(IX, [225, 200]))]);
  add2("L08", withVoids([vd(IX - 6.5, IX + 6.5, -260, 260, 10)]), [top(topLines(IX, 0, 90))]);
  for (const g of [3, 30, 60]) add2(`L${String(9 + [3, 30, 60].indexOf(g)).padStart(2, "0")}`, [bx("left", -240, -g / 2, 0, TOP, -240, 240), bx("right", g / 2, 240, 0, TOP, -240, 240)], [top(topLines(0, 0, 120)), front(frontLines(0, [120]))]);
  add2("L12", [bx("low", -240, 240, 0, 180, -240, 240), bx("high", -240, 240, 180, TOP, -240, 0)], [top(topLines(0, 0, 200)), front(frontLines(0, [210, 150]))]);
  add2("L13", [bx("s0", -240, 240, 0, 120, -240, 240), bx("s1", -240, 240, 120, 150, -240, 180), bx("s2", -240, 240, 150, 180, -240, 120), bx("s3", -240, 240, 180, 210, -240, 60), bx("s4", -240, 240, 210, TOP, -240, 0)], [top(topLines(0, 60, 200)), front(frontLines(0, [225, 165]))]);
  add2("L14", [bx("back", -240, 240, 0, TOP, -240, 0), bx("arm", -240, 0, 0, TOP, 0, 240)], [top(topLines(120, 120, 200)), front(frontLines(120, [120]))]);
  add2("L15", withVoids([vd(-23.5, 23.5, 190, 260, 60)]), [top(topLines(0, 215, 100)), front(frontLines(0, [210]))]);
  add2("L16", withVoids([vd(140, 260, 140, 260, 100)]), [top(topLines(190, 190, 120)), front(frontLines(190, [190]))]);
  add2("L17", [...base(), bx("slab", -150, 150, TOP, 270, 100, 340)], [top(topLines(0, 200, 200)), front(frontLines(0, [255, 200], 340, 60, 269.5)), bottom([{ a: [0, 0, -200], b: [0, 0, 330] }])]);
  const tray = [bx("floor", -150, 150, 0, 20, -150, 150), bx("wl", -150, -130, 20, 120, -150, 150), bx("wr", 130, 150, 20, 120, -150, 150), bx("wb", -130, 130, 20, 120, -150, -130), bx("wf", -130, 130, 20, 120, 130, 150)];
  add2("L18", tray, [top(topLines(0, 0, 145, 120))]);
  add2("L19", [...tray, bx("lid", -150, 150, 120, 140, -150, 150)], [top(topLines(0, 0, 145, 140))]);
  add2("L20", [...base(), bx("cube", -50, 50, 210, 310, -50, 50)], [top(topLines(0, 0, 140))]);
  add2("L21", [...base(), bx("ca", -100, 0, TOP, 340, -100, 0), bx("cb", 0, 100, TOP, 340, 0, 100)], [top(topLines(0, 0, 160))]);
  add2("L22", [...base(), bx("ca", -100, 0, TOP, 340, -100, 0), bx("cb", 0, 100, 340, 440, 0, 100)], [top(topLines(0, 0, 160))]);
  add2("L23", [...base(), bx("pl", -130, -70, TOP, 360, -30, 30), bx("pr", 70, 130, TOP, 360, -30, 30), bx("lintel", -130, 130, 360, 400, -30, 30)], [top(topLines(0, 0, 200, 400)), front([{ a: [200, 300, 240], b: [-200, 300, 240] }, { a: [0, 100, 240], b: [0, 399.5, 240] }])]);
  const legs = [[-200, -170], [170, 200]].flatMap(([x0, x1]) => [[-200, -170], [170, 200]].map(([z0, z1]) => bx(`leg${x0}${z0}`, x0!, x1!, 0, 200, z0!, z1!)));
  add2("L24", [bx("top", -200, 200, 200, 230, -200, 200), ...legs], [top(topLines(0, 0, 195, 230)), front([{ a: [0, 10, 200], b: [0, 229.5, 200] }, { a: [195, 100, 200], b: [-195, 100, 200] }]), bottom([{ a: [-195, 0, 0], b: [195, 0, 0] }])]);
  add2("L25", withVoids([vd(-30, 30, -30, 30, 120), { lo: [-30, 120, -30], hi: [30, 180, 260] }]), [top(topLines(0, 0, 120)), front(frontLines(0, [150]))]);
  const ends = (z0: number, z1: number) => [bx("e0", -240, 240, 0, TOP, -240, z0), bx("e1", -240, 240, 0, TOP, z1, 240)];
  add2("L26", [bx("l", -240, -35, 0, TOP, -100, 100), prismZ("cl", [[-35, 0], [-15, 0], [-15, 220], [-35, TOP]], -100, 100), prismZ("cr", [[15, 0], [35, 0], [35, TOP], [15, 220]], -100, 100), bx("r", 35, 240, 0, TOP, -100, 100), bx("fl", -15, 15, 0, 180, -100, 100), ...ends(-100, 100)], [top(topLines(0, 0, 120))]);
  add2("L27", [prismZ("vl", [[-240, 0], [0, 0], [0, 210], [-30, TOP], [-240, TOP]], -240, 240), prismZ("vr", [[0, 0], [240, 0], [240, TOP], [30, TOP], [0, 210]], -240, 240)], [top(topLines(0, 0, 120))]);
  add2("L28", withVoids([vd(IX - 40, IX + 40, IZ - 40, IZ + 40, 15), vd(IX - 20, IX + 20, IZ - 20, IZ + 20, 60)]), [top(topLines(IX, IZ, 120))]);
  add2("L29", [bx("l", -240, -25, 0, TOP, -240, 240), prismZ("wl", [[-25, 215], [-15, TOP], [-25, TOP]], -240, 240), prismZ("wr", [[25, 215], [25, TOP], [15, TOP]], -240, 240), bx("r", 25, 240, 0, TOP, -240, 240), bx("f", -25, 25, 0, 215, -240, 240)], [top(topLines(0, 0, 100)), front(frontLines(0, [230]))]);
  const ramp = (deg: number) => {
    const drop = 120 * Math.tan((deg * Math.PI) / 180);
    return [prismZ("ramp", [[-60, 0], [60, 0], [60, TOP - drop], [-60, TOP]], -30, 30), bx("xl", -240, -60, 0, TOP, -30, 30), bx("xr", 60, 240, 0, TOP, -30, 30), bx("zb", -240, 240, 0, TOP, -240, -30), bx("zf", -240, 240, 0, TOP, 30, 240)];
  };
  add2("L30", ramp(18), [top(topLines(0, 0, 120))]);
  add2("L31", ramp(35), [top(topLines(0, 0, 120))]);
  add2("L32", [...withVoids([vd(IX - 75, IX + 75, IZ - 75, IZ + 75, 40)]), bx("boss", IX - 25, IX + 25, 200, 220, IZ - 25, IZ + 25)], [top(topLines(IX, IZ, 140))]);
  add2("L33", [...base(), bx("tw", IX - 40, IX - 25, TOP, 300, IZ - 40, IZ + 40), bx("te", IX + 25, IX + 40, TOP, 300, IZ - 40, IZ + 40), bx("tn", IX - 25, IX + 25, TOP, 300, IZ - 40, IZ - 25), bx("ts", IX - 25, IX + 25, TOP, 300, IZ + 25, IZ + 40)], [top(topLines(IX, IZ, 120))]);
  const pro = (id: string, x0: number, x1: number, h: number, z0: number, z1: number, y0 = TOP) => bx(id, x0, x1, y0, y0 + h, z0, z1);
  add2("L34", [...base(), pro("plateau", IX - 60, IX + 60, 20, IZ - 60, IZ + 60)], [top(topLines(IX, IZ, 140))]);
  add2("L35", [...base(), pro("pin", IX - 5, IX + 5, 40, IZ - 5, IZ + 5)], [top(topLines(IX, IZ, 100))]);
  add2("L36", [...base(), pro("rib", IX - 5, IX + 5, 15, -150, 150)], [top(topLines(IX, 0, 100))]);
  add2("L37", [...base(), pro("stem", IX - 10, IX + 10, 30, IZ - 10, IZ + 10), pro("cap", IX - 30, IX + 30, 10, IZ - 30, IZ + 30, TOP + 30)], [top(topLines(IX, IZ, 110))]);
  const grille = (x: number, z: number) => { const v: { lo: V; hi: V }[] = []; for (let i = 0; i < 6; i++) for (let j = 0; j < 6; j++) v.push(vd(x - 85 + 30 * i, x - 65 + 30 * i, z - 85 + 30 * j, z - 65 + 30 * j, TOP)); return withVoids(v); };
  add2("L38", grille(IX, IZ), [top(topLines(IX, IZ, 130))]);
  const studs = (x: number, z: number, h = 8) => { const p: Part[] = []; for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) p.push(pro(`st${i}${j}`, x - 66 + 40 * i, x - 54 + 40 * i, h, z - 66 + 40 * j, z - 54 + 40 * j)); return p; };
  add2("L39", [...base(), ...studs(IX, IZ)], [top(topLines(IX, IZ, 130))]);
  add2("L40", withVoids([vd(-200, 200, -200, 200, 20)]), [top(topLines(0, 0, 239))]);
  add2("L41", withVoids([vd(-260, 260, 180, 260, 30)]), [top(topLines(0, 180, 100)), front(frontLines(0, [225]))]);
  for (const h of [0.3, 1, 6]) add2(`L${42 + [0.3, 1, 6].indexOf(h)}`, [...base(), pro("raise", -240, 240, h, -240, 0)], [top(topLines(0, 0, 150))]);
  const g8 = 240 * Math.tan((8 * Math.PI) / 180);
  add2("L45", [...base(), prismZ("rl", [[-240, TOP], [0, TOP], [0, TOP + g8]], -240, 240), prismZ("rr", [[0, TOP], [240, TOP], [0, TOP + g8]], -240, 240)], [top(topLines(0, 0, 200, TOP + 33.7))]);
  add2("L46", [...base(), prismZ("blade", [[-15, TOP], [15, TOP], [0, TOP + 85]], -150, 150)], [top(topLines(0, 0, 120)), front(frontLines(0, [280], 150, 60, 324.5))]);
  add2("L47", [...base(), pro("fin", IX - 2, IX + 2, 80, -100, 100)], [top(topLines(IX, 0, 100))]);
  add2("L48", [bx("back", -240, 240, 0, TOP, -240, -120), bx("al", -240, -120, 0, TOP, -120, 240), bx("ar", 120, 240, 0, TOP, -120, 240)], [top(topLines(0, 60, 230)), front(frontLines(0, [120]))]);
  add2("L49", [bx("rb", -240, 240, 0, TOP, -240, -100), bx("rf", -240, 240, 0, TOP, 100, 240), bx("rl", -240, -100, 0, TOP, -100, 100), bx("rr", 100, 240, 0, TOP, -100, 100)], [top(topLines(0, 0, 200))]);
  add2("L50", [bx("tl", -240, -120, 0, 400, -60, 60), bx("tr", 120, 240, 0, 400, -60, 60), bx("br", -120, 120, 360, 400, -60, 60)], [front(frontLines(0, [200], 60, 10, 399.5)), top(topLines(0, 0, 230, 400))]);
  add2("L51", [], []);
  add2("L52", [bx("tiny", -15, 15, 0, 30, -15, 15)], [top(topLines(0, 0, 60, 30))]);
  const keyed = (w: number, l: number) => withVoids([vd(IX - w / 2, IX + w / 2, IZ - l / 2, IZ + l / 2, 30)]);
  add2("L53", keyed(25, 105), [top(topLines(IX, IZ, 120))], ["A", "bar", "barT"]);
  // the pairs
  add2("Q01", withVoids([vd(-50, 50, -50, 50, TOP)]), [top(topLines(0, 0, 140))]);
  add2("Q02", withVoids([vd(-30, 30, -260, 260, 30)]), [top(topLines(0, 0, 160)), front(frontLines(0, [225]))]);
  add2("Q03", [...withVoids([vd(IX - 30, IX + 30, IZ - 30, IZ + 30, 40)]), bx("pin", -55, -45, TOP, 270, IZ - 5, IZ + 5)], [top(topLines(IX, IZ, 120))]);
  add2("Q04", withVoids([vd(IX - 50, IX + 50, -260, 0, 40), vd(IX - 50, IX + 50, 0, 260, 60)]), [top(topLines(IX, 0, 160))]);
  add2("Q05", withVoids([vd(IX - 55, IX - 25, IZ - 15, IZ + 15, 40), vd(IX + 25, IX + 55, IZ - 15, IZ + 15, 40)]), [top(topLines(IX, IZ, 110))]);
  add2("Q06", [...base(), bx("boss", -30, 30, TOP, 280, 180, 240)], [top(topLines(0, 210, 100)), front(frontLines(0, [260]))]);
  add2("Q07", [...withVoids([vd(-30, 30, 150, 210, 40)]), bx("post", -100, -80, TOP, 300, 100, 240), bx("slab", -100, 100, 300, 320, 100, 240)], [top(topLines(0, 180, 100)), front(frontLines(0, [270]))]);
  add2("Q08", (() => { const v: { lo: V; hi: V }[] = []; for (let i = 0; i < 6; i++) for (let j = 0; j < 6; j++) v.push(vd(-85 + 30 * i, -65 + 30 * i, -85 + 30 * j, -65 + 30 * j, TOP)); return withVoids(v); })(), [top(topLines(0, 0, 130))]);
  add2("Q09", [...withVoids([vd(IX - 40, IX + 40, IZ - 40, IZ + 40, 40)]), bx("pin", IX - 10, IX + 10, 200, 250, IZ - 10, IZ + 10)], [top(topLines(IX, IZ, 120))]);
  add2("Q10", [...withVoids([vd(IX - 30, IX + 30, -260, 260, 30)]), bx("fin", IX - 36, IX - 32, TOP, 300, -100, 100)], [top(topLines(IX, 0, 120))]);
  return S;
}

/** the places of a travel, `step` mm apart, as (L, s) on the study's frame (`checks.ts` `placesOf`) */
export function placesOf(st: Study, ln: Line, step = 1): [number, number][] {
  const d = sub(ln.b, ln.a);
  const n = Math.max(1, Math.round(Math.hypot(...d) / step));
  const out: [number, number][] = [];
  for (let i = 0; i <= n; i++) { const p = add(ln.a, mul(d, i / n)); out.push([dot(p, st.t), dot(p, st.b)]); }
  return out;
}

// ───────────────────────────── to the landing map's inputs (METRES) ─────────────────────────────
const M = 0.001;
/** the parts as the landing map's convex pieces, metres */
export const toConvex = (parts: readonly Part[]) => parts.map((p) => ({ id: p.id, points: p.verts.map((v): Vec3 => [v[0] * M, v[1] * M, v[2] * M]) }));
/** a box piece as held, axis-aligned in (t, b), its bottom face's centre the reference point, metres */
export function boxHeld(pc: BoxPiece, f: { n: V; t: V; b: V }): Vec3[] {
  const out: Vec3[] = [];
  for (const sa of [-1, 1]) for (const sc of [-1, 1]) for (const h of [0, pc.H]) {
    const p = add(add(mul(f.t, sa * pc.a), mul(f.b, sc * pc.c)), mul(f.n, h));
    out.push([p[0] * M, p[1] * M, p[2] * M]);
  }
  return out;
}
/** the frame of a study for the landing map: origin 0 (a depth = n·x), the region in metres */
export const frameOf = (f: { n: V; t: V; b: V }, uMin: number, uMax: number, vMin: number, vMax: number) => ({
  origin: [0, 0, 0] as Vec3, u: f.t as Vec3, v: f.b as Vec3, n: f.n as Vec3, uMin: uMin * M, uMax: uMax * M, vMin: vMin * M, vMax: vMax * M,
});
